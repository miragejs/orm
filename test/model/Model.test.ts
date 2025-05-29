import type { ModelAttrs } from '@src/model/BaseModel';
import Model from '@src/model/Model';

interface UserAttrs extends ModelAttrs<number> {
  name: string;
  email: string;
}

describe('Model', () => {
  describe('create', () => {
    it('should create a model instance with attribute getters/setters', () => {
      const user = Model.create<UserAttrs>({
        name: 'User',
        attrs: { name: 'John', email: 'john@example.com' },
      });

      expect(user.name).toBe('John');
      expect(user.email).toBe('john@example.com');
      expect(user.isNew()).toBe(true);
    });

    it('should allow attribute modification', () => {
      const user = Model.create<UserAttrs>({
        name: 'User',
        attrs: { name: 'John', email: 'john@example.com' },
      });

      user.name = 'Jane';
      expect(user.name).toBe('Jane');
      expect(user.attrs.name).toBe('Jane');
    });

    it('should preserve model methods', () => {
      const user = Model.create<UserAttrs>({
        name: 'User',
        attrs: { name: 'John', email: 'john@example.com' },
      });

      expect(typeof user.save).toBe('function');
      expect(typeof user.update).toBe('function');
      expect(typeof user.destroy).toBe('function');
    });
  });
});
