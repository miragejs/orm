import { associations } from '@src/associations';
import { model, type ModelInstance } from '@src/model';
import { BelongsTo, belongsTo, HasMany, hasMany } from '@src/relations';
import {
  collection,
  CollectionConfig,
  schema,
  SchemaInstance,
} from '@src/schema';
import { resolveFactoryAttr } from '@src/utils';

import Factory from '../Factory';
import { factory } from '../FactoryBuilder';

// Define test model attributes
interface UserAttrs {
  age?: number;
  bio?: string;
  createdAt?: string | null;
  email: string;
  id: string;
  name: string;
  processed?: boolean;
  role?: string;
  subscription?: string;
  manager?: string;
}

// Create test model
const userModel = model()
  .name('user')
  .collection('users')
  .attrs<UserAttrs>()
  .build();

// Define test model type
type UserModel = typeof userModel;

// Create simple schema for build() method dependency
const testSchema = schema()
  .collections({
    users: collection().model(userModel).build(),
  })
  .build();

type TestSchema = {
  users: CollectionConfig<UserModel>;
};

describe('Factory', () => {
  beforeEach(() => {
    // Clear database before each test
    testSchema.db.emptyData();
  });

  describe('Constructor', () => {
    it('should initialize with model, attributes, traits, and afterCreate hook', () => {
      const attributes = {
        name: 'John Doe',
        role: 'user',
        email: (id: string) => `user${id}@example.com`,
      };
      const traits = {
        admin: {
          name: 'Admin',
          role: 'admin',
          email: (id: string) => `admin${id}@example.com`,
        },
      };
      const afterCreate = (model: ModelInstance<UserModel>) => {
        model.processed = true;
      };

      const factory = new Factory(
        userModel,
        attributes,
        traits,
        undefined,
        afterCreate,
      );

      expect(factory.template).toBe(userModel);
      expect(factory.attributes).toBe(attributes);
      expect(factory.traits).toBe(traits);
      expect(factory.afterCreate).toBe(afterCreate);
    });

    it('should initialize without afterCreate hook', () => {
      const attributes = { name: 'John', email: 'john@example.com' };
      const factory = new Factory(userModel, attributes);

      expect(factory.template).toBe(userModel);
      expect(factory.attributes).toBe(attributes);
      expect(factory.traits).toMatchObject({});
      expect(factory.afterCreate).toBeUndefined();
    });

    it('should initialize with default empty attributes', () => {
      const factory = new Factory(userModel);

      expect(factory.template).toBe(userModel);
      expect(factory.attributes).toEqual({});
      expect(factory.traits).toEqual({});
      expect(factory.afterCreate).toBeUndefined();
    });
  });

  describe('build()', () => {
    const userFactory = new Factory<UserModel, 'admin' | 'premium', TestSchema>(
      userModel,
      {
        name: () => 'John Doe',
        email(id: string) {
          const name = resolveFactoryAttr(this.name, id)
            .split(' ')
            .join('.')
            .toLowerCase();
          return `${name}-${id}@example.com`;
        },
        role: 'user',
        subscription: 'free',
        createdAt: null,
      },
      {
        admin: {
          role: 'admin',
          email: (id: string) => `admin-${id}@example.com`,
        },
        premium: {
          subscription: 'premium',
        },
      },
    );

    it('should build model attributes with given defaults', () => {
      const attrs = userFactory.build(testSchema, {
        name: 'Alice',
        email: 'alice@example.com',
      });

      expect(attrs).toMatchObject({
        id: '1',
        name: 'Alice',
        email: 'alice@example.com',
        role: 'user',
        createdAt: null,
        subscription: 'free',
      });
    });

    it('should build model attributes with trait', () => {
      const attrs = userFactory.build(testSchema, 'admin');

      expect(attrs).toMatchObject({
        name: 'John Doe',
        role: 'admin',
        createdAt: null,
        subscription: 'free',
      });
      expect(attrs.email).toMatch('admin-1@example.com');
      expect(attrs.id).toBeDefined();
    });

    it('should build model attributes with multiple traits', () => {
      const attrs = userFactory.build(testSchema, 'admin', 'premium');

      expect(attrs).toMatchObject({
        createdAt: null,
        name: 'John Doe',
        role: 'admin',
        subscription: 'premium',
      });
      expect(attrs.email).toMatch('admin-1@example.com');
      expect(attrs.id).toBeDefined();
    });

    it('should build model attributes with traits and default overrides', () => {
      const attrs = userFactory.build(testSchema, 'admin', {
        name: 'Super Admin',
        age: 35,
      });

      expect(attrs).toMatchObject({
        name: 'Super Admin', // overridden
        email: 'admin-1@example.com',
        age: 35, // added
        role: 'admin',
        createdAt: null,
      });
    });

    it('should handle function attributes correctly', () => {
      const dynamicFactory = new Factory<UserModel, 'member', TestSchema>(
        userModel,
        {
          name: (id) => {
            return `User ${id}`;
          },
          email(id) {
            const name = resolveFactoryAttr(this.name, id)
              .replace(' ', '-')
              .toLowerCase();
            return `${name}@example.com`;
          },
          role: 'member',
        },
      );

      const attrs = dynamicFactory.build(testSchema);
      expect(attrs).toMatchObject({
        name: 'User 1',
        email: 'user-1@example.com',
        role: 'member',
      });
    });

    it('should handle static values', () => {
      const staticFactory = new Factory<UserModel, never, TestSchema>(
        userModel,
        {
          email: 'static@example.com',
          name: 'Static User',
          role: 'guest',
          createdAt: '2024-01-01T00:00:00Z',
        },
      );

      const attrs = staticFactory.build(testSchema);
      expect(attrs).toMatchObject({
        email: 'static@example.com',
        name: 'Static User',
        role: 'guest',
        createdAt: '2024-01-01T00:00:00Z',
      });
    });

    it('should call function attributes only once, especially when they depend on each other', () => {
      const called = new Map<string, number>();

      const dynamicFactory = new Factory<UserModel, never, TestSchema>(
        userModel,
        {
          email(id) {
            called.set('email', (called.get('email') ?? 0) + 1);

            const name = resolveFactoryAttr(this.name, id)
              .split(' ')
              .join('.')
              .toLowerCase();
            return `${name}-${id}@example.com`;
          },
          name(id) {
            called.set('name', (called.get('name') ?? 0) + 1);
            return `User ${id}`;
          },
          bio(id) {
            called.set('bio', (called.get('bio') ?? 0) + 1);

            const name = resolveFactoryAttr(this.name, id);
            const email = resolveFactoryAttr(this.email, id);
            return `User: ${name} - ${email}`;
          },
          role: 'member',
        },
      );
      dynamicFactory.build(testSchema);

      expect(called.get('name')).toBe(1);
      expect(called.get('email')).toBe(1);
      expect(called.get('bio')).toBe(1);
    });

    it('should throw error for circular dependencies in attributes', () => {
      expect(() => {
        const factory = new Factory<UserModel, never, TestSchema>(userModel, {
          name(id) {
            const email = resolveFactoryAttr(this.email, id);
            return email?.split('@')[0] ?? '';
          },
          email(id) {
            const name = resolveFactoryAttr(this.name, id);
            return name + '@example.com';
          },
        });

        factory.build(testSchema);
      }).toThrow(
        `[Mirage]: Circular dependency detected in user factory: name -> email -> name`,
      );
    });

    it('should handle chained attribute dependencies', () => {
      const factory = new Factory<UserModel, never, TestSchema>(userModel, {
        name: () => 'John',
        role: 'admin',
        email(id) {
          const name = resolveFactoryAttr(this.name, id);
          const role = resolveFactoryAttr(this.role, id);
          return `${name}.${role}@example.com`.toLowerCase();
        },
      });

      const attrs = factory.build(testSchema);
      expect(attrs.email).toBe('john.admin@example.com');
    });
  });

  describe('runAfterCreateHooks()', () => {
    it('should execute factory afterCreate hook', () => {
      const factory = new Factory<UserModel, never, TestSchema>(
        userModel,
        { name: 'John', email: 'john@example.com', processed: false },
        undefined,
        undefined,
        (model) => {
          model.update({ processed: true });
        },
      );

      const attrs = factory.build(testSchema);
      const model = testSchema.users.new(attrs).save();
      factory.runAfterCreateHooks(testSchema, model);

      expect(model.processed).toBe(true);
    });

    it('should execute trait afterCreate hooks', () => {
      const factory = new Factory<UserModel, 'admin', TestSchema>(
        userModel,
        {
          name: 'John',
          email: 'john@example.com',
          role: 'user',
          subscription: 'free',
        },
        {
          admin: {
            role: 'admin',
            afterCreate(model) {
              model.update({ subscription: 'premium' });
            },
          },
        },
      );

      const attrs = factory.build(testSchema, 'admin');
      const model = testSchema.users.new(attrs).save();
      factory.runAfterCreateHooks(testSchema, model, 'admin');

      expect(model.role).toBe('admin');
      expect(model.subscription).toBe('premium');
    });

    it('should execute multiple trait hooks in order', () => {
      const hooksCalled: string[] = [];

      const factory = new Factory<UserModel, 'first' | 'second', TestSchema>(
        userModel,
        { name: 'John', email: 'john@example.com' },
        {
          first: {
            role: 'first',
            afterCreate: () => {
              hooksCalled.push('trait:first');
            },
          },
          second: {
            role: 'second',
            afterCreate: () => {
              hooksCalled.push('trait:second');
            },
          },
        },
      );

      const attrs = factory.build(testSchema, 'first', 'second');
      const model = testSchema.users.new(attrs).save();
      factory.runAfterCreateHooks(testSchema, model, 'first', 'second');

      expect(model.role).toBe('second');
      expect(hooksCalled).toEqual(['trait:first', 'trait:second']);
    });

    it('should execute factory hook before trait hooks', () => {
      const hooksCalled: string[] = [];

      const factory = new Factory<UserModel, 'admin', TestSchema>(
        userModel,
        { name: 'John', email: 'john@example.com' },
        {
          admin: {
            afterCreate(model) {
              model.update({ role: 'admin' });
              hooksCalled.push('trait:admin');
            },
          },
        },
        undefined,
        () => {
          model.update({ role: 'user' });
          hooksCalled.push('factory');
        },
      );

      const attrs = factory.build(testSchema, 'admin');
      const model = testSchema.users.new(attrs).save();
      factory.runAfterCreateHooks(testSchema, model, 'admin');

      expect(model.role).toBe('admin');
      expect(hooksCalled).toEqual(['factory', 'trait:admin']);
    });

    it('should handle models without hooks gracefully', () => {
      const factory = new Factory<UserModel, never, TestSchema>(userModel, {
        name: 'John',
        email: 'john@example.com',
      });

      const attrs = factory.build(testSchema);
      const model = testSchema.users.new(attrs).save();
      const result = factory.runAfterCreateHooks(testSchema, model);

      expect(result).toBe(model);
    });

    it('should pass schema to afterCreate hooks', () => {
      testSchema.users.create({
        name: 'Jane',
        email: 'jane@example.com',
      });

      const factory = new Factory<UserModel, never, TestSchema>(
        userModel,
        { name: 'John', email: 'john@example.com' },
        undefined,
        undefined,
        (model, schema) => {
          const manager = schema.users.first();
          model.update({ manager: manager?.email, role: 'user' });
        },
      );

      const attrs = factory.build(testSchema);
      const model = testSchema.users.new(attrs).save();
      factory.runAfterCreateHooks(testSchema, model);

      expect(model.id).toBe('2');
      expect(model.name).toBe('John');
      expect(model.email).toBe('john@example.com');
      expect(model.role).toBe('user');
      expect(model.manager).toBe('jane@example.com');
    });

    it('should ignore non-string arguments when processing traits', () => {
      const hooksCalled: string[] = [];

      const factory = new Factory<UserModel, 'admin', TestSchema>(
        userModel,
        { name: 'John', email: 'john@example.com' },
        {
          admin: {
            role: 'admin',
            afterCreate: () => {
              hooksCalled.push('trait:admin');
            },
          },
        },
      );

      const attrs = factory.build(testSchema, 'admin', { age: 30 });
      const model = testSchema.users.new(attrs).save();
      factory.runAfterCreateHooks(testSchema, model, 'admin', { age: 30 });

      expect(model.role).toBe('admin');
      expect(model.age).toBe(30);
      expect(hooksCalled).toEqual(['trait:admin']);
    });
  });

  describe('runAssociations()', () => {
    // Define models for association testing
    interface TeamAttrs {
      id: string;
      name: string;
    }

    interface MemberAttrs {
      id: string;
      name: string;
      email: string;
    }

    const teamModel = model()
      .name('team')
      .collection('teams')
      .attrs<TeamAttrs>()
      .build();

    type TeamModel = typeof teamModel;

    const memberModel = model()
      .name('member')
      .collection('members')
      .attrs<MemberAttrs>()
      .build();

    type MemberModel = typeof memberModel;

    const memberFactory = factory()
      .model(memberModel)
      .attrs({
        name: 'Member',
        email: (id: string) => `member${id}@example.com`,
      })
      .build();

    it('should process associations and return relationship values', () => {
      type AssocSchema = {
        teams: CollectionConfig<
          TeamModel,
          { members: HasMany<MemberModel> },
          Factory<TeamModel, string, AssocSchema>
        >;
        members: CollectionConfig<
          MemberModel,
          { team: BelongsTo<TeamModel> },
          Factory<MemberModel>
        >;
      };

      const teamFactory = factory<AssocSchema>()
        .model(teamModel)
        .attrs({ name: 'Team Alpha' })
        .associations({
          members: associations.createMany(memberModel, 2),
        })
        .build();

      const assocSchema: SchemaInstance<AssocSchema> = schema()
        .collections({
          teams: collection()
            .model(teamModel)
            .factory(teamFactory)
            .relationships({
              members: hasMany(memberModel),
            })
            .build(),
          members: collection()
            .model(memberModel)
            .factory(memberFactory)
            .relationships({
              team: belongsTo(teamModel),
            })
            .build(),
        })
        .build();

      // 1. Build base attributes (without associations)
      const attrs = teamFactory.build(assocSchema);
      expect(attrs).toMatchObject({ name: 'Team Alpha' });
      expect(attrs).not.toHaveProperty('memberIds');

      // 2. Save model to DB
      const team = assocSchema.teams.new(attrs).save();
      expect(team.id).toBe('1');

      // 3. Run associations - should create members and return relationship values
      const relValues = teamFactory.runAssociations(assocSchema, team);

      // relValues contains the relationship name with model collection
      expect(relValues).toHaveProperty('members');
      expect(relValues.members?.length).toBe(2);

      // Verify members were created
      expect(assocSchema.members.all().length).toBe(2);

      // 4. Update model with relationship values (FK extraction happens here)
      team.update(relValues);
      expect(team.memberIds).toHaveLength(2);
    });

    it('should return empty object when no associations are defined', () => {
      type SimpleAssocSchema = {
        teams: CollectionConfig<
          TeamModel,
          { members: HasMany<MemberModel> },
          Factory<TeamModel, string, SimpleAssocSchema>
        >;
        members: CollectionConfig<
          MemberModel,
          { team: BelongsTo<TeamModel> },
          Factory<MemberModel>
        >;
      };

      const simpleTeamFactory = factory<SimpleAssocSchema>()
        .model(teamModel)
        .attrs({ name: 'Simple Team' })
        .build();

      const assocSchema: SchemaInstance<SimpleAssocSchema> = schema()
        .collections({
          teams: collection()
            .model(teamModel)
            .factory(simpleTeamFactory)
            .relationships({
              members: hasMany(memberModel),
            })
            .build(),
          members: collection()
            .model(memberModel)
            .factory(memberFactory)
            .relationships({
              team: belongsTo(teamModel),
            })
            .build(),
        })
        .build();

      const attrs = simpleTeamFactory.build(assocSchema);
      const team = assocSchema.teams.new(attrs).save();
      const relValues = simpleTeamFactory.runAssociations(assocSchema, team);

      expect(relValues).toEqual({});
    });

    it('should skip associations when user provides relationship values', () => {
      type SkipAssocSchema = {
        teams: CollectionConfig<
          TeamModel,
          { members: HasMany<MemberModel> },
          Factory<TeamModel, string, SkipAssocSchema>
        >;
        members: CollectionConfig<
          MemberModel,
          { team: BelongsTo<TeamModel> },
          Factory<MemberModel>
        >;
      };

      const teamFactory = factory<SkipAssocSchema>()
        .model(teamModel)
        .attrs({ name: 'Team Beta' })
        .associations({
          members: associations.createMany(memberModel, 3),
        })
        .build();

      const assocSchema: SchemaInstance<SkipAssocSchema> = schema()
        .collections({
          teams: collection()
            .model(teamModel)
            .factory(teamFactory)
            .relationships({
              members: hasMany(memberModel),
            })
            .build(),
          members: collection()
            .model(memberModel)
            .factory(memberFactory)
            .relationships({
              team: belongsTo(teamModel),
            })
            .build(),
        })
        .build();

      // Create an existing member
      const existingMember = assocSchema.members.create({ name: 'Existing' });

      // Build and save team
      const attrs = teamFactory.build(assocSchema);
      const team = assocSchema.teams.new(attrs).save();

      // Run associations with user-provided memberIds - should skip creating new members
      const relValues = teamFactory.runAssociations(assocSchema, team, {
        memberIds: [existingMember.id],
      });

      // Should return empty because user provided the relationship value
      expect(relValues).toEqual({});

      // No new members should have been created (only the existing one)
      expect(assocSchema.members.all().length).toBe(1);
    });

    it('should process trait associations', () => {
      type TraitAssocSchema = {
        teams: CollectionConfig<
          TeamModel,
          { members: HasMany<MemberModel> },
          Factory<TeamModel, 'withMembers', TraitAssocSchema>
        >;
        members: CollectionConfig<
          MemberModel,
          { team: BelongsTo<TeamModel> },
          Factory<MemberModel>
        >;
      };

      const teamFactory = factory<TraitAssocSchema>()
        .model(teamModel)
        .attrs({ name: 'Team Gamma' })
        .traits({
          withMembers: {
            members: associations.createMany(memberModel, 5),
          },
        })
        .build();

      const assocSchema: SchemaInstance<TraitAssocSchema> = schema()
        .collections({
          teams: collection()
            .model(teamModel)
            .factory(teamFactory)
            .relationships({
              members: hasMany(memberModel),
            })
            .build(),
          members: collection()
            .model(memberModel)
            .factory(memberFactory)
            .relationships({
              team: belongsTo(teamModel),
            })
            .build(),
        })
        .build();

      // Build without trait - no associations
      const attrs = teamFactory.build(assocSchema);
      const team = assocSchema.teams.new(attrs).save();

      // Run associations with trait
      const relValues = teamFactory.runAssociations(
        assocSchema,
        team,
        'withMembers',
      );

      // relValues contains the relationship name with model collection
      expect(relValues).toHaveProperty('members');
      expect(relValues.members?.length).toBe(5);

      // Verify members were created
      expect(assocSchema.members.all().length).toBe(5);

      // Update model with relationship values (FK extraction happens here)
      team.update(relValues);
      expect(team.memberIds).toHaveLength(5);
    });
  });

  describe('Complex relationships integration', () => {
    // Define model attributes
    interface OrgAttrs {
      id: string;
      name: string;
    }

    interface EmployeeAttrs {
      id: string;
      name: string;
      email: string;
    }

    interface ProjectAttrs {
      id: string;
      title: string;
    }

    // Create models
    const orgModel = model()
      .name('org')
      .collection('orgs')
      .attrs<OrgAttrs>()
      .build();

    const employeeModel = model()
      .name('employee')
      .collection('employees')
      .attrs<EmployeeAttrs>()
      .build();

    const projectModel = model()
      .name('project')
      .collection('projects')
      .attrs<ProjectAttrs>()
      .build();

    type OrgModel = typeof orgModel;
    type EmployeeModel = typeof employeeModel;
    type ProjectModel = typeof projectModel;

    it('should synchronize all FKs when creating org with members who have projects', () => {
      // Define schema type with complex relationships
      type ComplexSchema = {
        orgs: CollectionConfig<
          OrgModel,
          {
            lead: BelongsTo<EmployeeModel, 'leadId'>; // inverse: null (disabled)
            members: HasMany<EmployeeModel, 'memberIds'>; // inverse: 'org'
            projects: HasMany<ProjectModel>;
          },
          Factory<OrgModel, 'withMembers', ComplexSchema>
        >;
        employees: CollectionConfig<
          EmployeeModel,
          {
            org: BelongsTo<OrgModel>; // inverse: 'members'
            projects: HasMany<ProjectModel>;
          },
          Factory<EmployeeModel, 'withProjects', ComplexSchema>
        >;
        projects: CollectionConfig<
          ProjectModel,
          {
            org: BelongsTo<OrgModel>;
            assignee: BelongsTo<EmployeeModel, 'assigneeId'>;
            creator: BelongsTo<EmployeeModel, 'creatorId'>;
          },
          Factory<ProjectModel, string, ComplexSchema>
        >;
      };

      // Create project factory
      const projectFactory = factory<ComplexSchema>()
        .model(projectModel)
        .attrs({
          title: (id: string) => `Project ${id}`,
        })
        .build();

      // Create employee factory with:
      // - Default org association (creates org if not provided)
      // - withProjects trait that creates projects using employee.orgId
      const employeeFactory = factory<ComplexSchema>()
        .model(employeeModel)
        .attrs({
          name: (id: string) => `Employee ${id}`,
          email: (id: string) => `employee${id}@example.com`,
        })
        .traits({
          withProjects: {
            afterCreate(employee, testSchema) {
              // Create 2 projects for each employee using employee.orgId
              // This tests that orgId is correctly injected via inverse FK
              testSchema.projects.createMany(2, {
                orgId: employee.orgId,
                assigneeId: employee.id,
                creatorId: employee.id,
              });
            },
          },
        })
        .associations({
          org: associations.create(orgModel),
        })
        .build();

      // Create org factory with withMembers trait
      const orgFactory = factory<ComplexSchema>()
        .model(orgModel)
        .attrs({
          name: (id: string) => `Organization ${id}`,
        })
        .traits({
          withMembers: {
            members: associations.createMany(employeeModel, 3, 'withProjects'),
          },
        })
        .build();

      // Build schema with all relationships
      const testSchema: SchemaInstance<ComplexSchema> = schema()
        .collections({
          orgs: collection()
            .model(orgModel)
            .factory(orgFactory)
            .relationships({
              lead: belongsTo(employeeModel, {
                foreignKey: 'leadId',
                inverse: null,
              }),
              members: hasMany(employeeModel, {
                foreignKey: 'memberIds',
                inverse: 'org',
              }),
              projects: hasMany(projectModel, {
                inverse: 'org',
              }),
            })
            .build(),
          employees: collection()
            .model(employeeModel)
            .factory(employeeFactory)
            .relationships({
              org: belongsTo(orgModel, {
                inverse: 'members',
              }),
              projects: hasMany(projectModel),
            })
            .build(),
          projects: collection()
            .model(projectModel)
            .factory(projectFactory)
            .relationships({
              org: belongsTo(orgModel, {
                inverse: 'projects',
              }),
              assignee: belongsTo(employeeModel, { foreignKey: 'assigneeId' }),
              creator: belongsTo(employeeModel, { foreignKey: 'creatorId' }),
            })
            .build(),
        })
        .build();

      // ============================================
      // ACT: Create org with members who have projects
      // ============================================
      const org = testSchema.orgs.create('withMembers');

      // ============================================
      // ASSERT: Verify all relationships are correct
      // ============================================

      // 1. Org should have 3 members
      expect(org.memberIds).toHaveLength(3);
      expect(testSchema.employees.all().length).toBe(3);

      // 2. All employees should have correct orgId (pointing to the created org)
      const employees = testSchema.employees.all();
      employees.models.forEach((employee) => {
        expect(employee.orgId).toBe(org.id);
      });

      // 3. Each employee created 2 projects = 6 total projects
      expect(testSchema.projects.all().length).toBe(6);

      // 4. All projects should have correct orgId
      const projects = testSchema.projects.all();
      projects.models.forEach((project) => {
        expect(project.orgId).toBe(org.id);
      });

      // 5. All projects should have valid assigneeId and creatorId
      projects.models.forEach((project) => {
        expect(org.memberIds).toContain(project.assigneeId);
        expect(org.memberIds).toContain(project.creatorId);
      });

      // 6. Org should have all project IDs via inverse sync
      expect(org.projectIds).toHaveLength(6);
      projects.models.forEach((project) => {
        expect(org.projectIds).toContain(project.id);
      });

      // 7. Verify relationship accessors work
      expect(org.members?.length).toBe(3);
      expect(org.projects?.length).toBe(6);
    });
  });
});
