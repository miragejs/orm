import { factory } from '@src/factory';
import SchemaFactory from '@src/factory/SchemaFactory';
import { model } from '@src/model';
import { describe, expect, it } from 'vitest';

describe('SchemaFactory', () => {
  interface UserAttrs {
    id: string;
    name: string;
    email: string;
  }

  const UserTemplate = model('user', 'users').attrs<UserAttrs>().create();

  // Mock schema instance for testing
  const mockSchemaInstance = {
    getCollection: () => ({}),
    db: {},
  } as any;

  describe('schema-aware afterCreate hooks', () => {
    it('should execute factory hooks with model only', () => {
      const factoryHookCalls: any[] = [];

      const userFactory = factory(UserTemplate)
        .attrs({ name: 'Jane', email: 'jane@example.com' })
        .afterCreate((model) => {
          factoryHookCalls.push({ type: 'factory', model, schema: undefined });
        })
        .create();

      const schemaFactory = new SchemaFactory(userFactory, mockSchemaInstance);
      const model = { id: '1', name: 'Jane', email: 'jane@example.com' } as any;

      schemaFactory.processAfterCreateHooks(model);

      expect(factoryHookCalls).toHaveLength(1);
      expect(factoryHookCalls[0]).toEqual({
        type: 'factory',
        model,
        schema: undefined,
      });
    });

    it('should execute schema-aware hooks with model and schema', () => {
      const schemaHookCalls: any[] = [];

      const userFactory = factory(UserTemplate)
        .attrs({ name: 'Bob', email: 'bob@example.com' })
        .create();

      const schemaFactory = new SchemaFactory(userFactory, mockSchemaInstance).afterCreate(
        (model, schema) => {
          schemaHookCalls.push({ type: 'schema', model, schema });
        },
      );

      const model = { id: '2', name: 'Bob', email: 'bob@example.com' } as any;

      schemaFactory.processAfterCreateHooks(model);

      expect(schemaHookCalls).toHaveLength(1);
      expect(schemaHookCalls[0]).toEqual({
        type: 'schema',
        model,
        schema: mockSchemaInstance,
      });
    });

    it('should execute both factory and schema-aware hooks in correct order', () => {
      const hookCalls: string[] = [];

      const userFactory = factory(UserTemplate)
        .attrs({ name: 'Alice', email: 'alice@example.com' })
        .afterCreate((model) => {
          hookCalls.push('factory-hook');
        })
        .create();

      const schemaFactory = new SchemaFactory(userFactory, mockSchemaInstance).afterCreate(
        (model, schema) => {
          hookCalls.push('schema-hook');
        },
      );

      const model = { id: '3', name: 'Alice', email: 'alice@example.com' } as any;

      schemaFactory.processAfterCreateHooks(model);

      expect(hookCalls).toEqual(['factory-hook', 'schema-hook']);
    });

    it('should execute schema-aware trait hooks', () => {
      const traitHookCalls: any[] = [];

      const userFactory = factory(UserTemplate)
        .attrs({ name: 'Charlie', email: 'charlie@example.com' })
        .create();

      const schemaFactory = new SchemaFactory(userFactory, mockSchemaInstance).traits({
        admin: {
          name: 'Admin User',
          afterCreate: (model, schema) => {
            traitHookCalls.push({ trait: 'admin', model, schema });
          },
        },
      });

      const model = { id: '4', name: 'Charlie', email: 'charlie@example.com' } as any;

      schemaFactory.processAfterCreateHooks(model, 'admin');

      expect(traitHookCalls).toHaveLength(1);
      expect(traitHookCalls[0]).toEqual({
        trait: 'admin',
        model,
        schema: mockSchemaInstance,
      });
    });
  });
});
