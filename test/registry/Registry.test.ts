import { IdentityManager } from '@src/db';
import { BaseFactory } from '@src/factory';
import { Model } from '@src/model';
import { Registry } from '@src/registry';

describe('Registry', () => {
  let registry: Registry;

  beforeEach(() => {
    registry = new Registry();
  });

  describe('models', () => {
    const MockModel = Model.define<any>();

    it('should register and get a model', () => {
      registry.models.set('User', MockModel);
      expect(registry.models.get('User')).toBe(MockModel);
    });

    it('should check if model exists', () => {
      expect(registry.models.has('User')).toBe(false);
      registry.models.set('User', MockModel);
      expect(registry.models.has('User')).toBe(true);
    });

    it('should throw when getting non-existent model', () => {
      expect(() => registry.models.get('User')).toThrow("No item registered for 'User'");
    });

    it('should throw when registering duplicate model', () => {
      registry.models.set('User', MockModel);
      expect(() => registry.models.set('User', MockModel)).toThrow(
        "Item 'User' is already registered",
      );
    });

    it('should delete a model', () => {
      registry.models.set('User', MockModel);
      registry.models.delete('User');
      expect(registry.models.has('User')).toBe(false);
    });

    it('should clear all models', () => {
      registry.models.set('User', MockModel);
      registry.models.set('Post', MockModel);
      registry.models.clear();
      expect(registry.models.has('User')).toBe(false);
      expect(registry.models.has('Post')).toBe(false);
    });
  });

  describe('factories', () => {
    const mockFactory = {} as BaseFactory<any>;

    it('should register and get a factory', () => {
      registry.factories.set('User', mockFactory);
      expect(registry.factories.get('User')).toBe(mockFactory);
    });

    it('should check if factory exists', () => {
      expect(registry.factories.has('User')).toBe(false);
      registry.factories.set('User', mockFactory);
      expect(registry.factories.has('User')).toBe(true);
    });

    it('should throw when getting non-existent factory', () => {
      expect(() => registry.factories.get('User')).toThrow("No item registered for 'User'");
    });

    it('should throw when registering duplicate factory', () => {
      registry.factories.set('User', mockFactory);
      expect(() => registry.factories.set('User', mockFactory)).toThrow(
        "Item 'User' is already registered",
      );
    });

    it('should delete a factory', () => {
      registry.factories.set('User', mockFactory);
      registry.factories.delete('User');
      expect(registry.factories.has('User')).toBe(false);
    });

    it('should clear all factories', () => {
      registry.factories.set('User', mockFactory);
      registry.factories.set('Post', mockFactory);
      registry.factories.clear();
      expect(registry.factories.has('User')).toBe(false);
      expect(registry.factories.has('Post')).toBe(false);
    });
  });

  describe('identityManagers', () => {
    const mockManager = new IdentityManager();

    it('should register and get an identity manager', () => {
      registry.identityManagers.set('User', mockManager);
      expect(registry.identityManagers.get('User')).toBe(mockManager);
    });

    it('should check if identity manager exists', () => {
      expect(registry.identityManagers.has('User')).toBe(false);
      registry.identityManagers.set('User', mockManager);
      expect(registry.identityManagers.has('User')).toBe(true);
    });

    it('should throw when getting non-existent identity manager', () => {
      expect(() => registry.identityManagers.get('User')).toThrow("No item registered for 'User'");
    });

    it('should throw when registering duplicate identity manager', () => {
      registry.identityManagers.set('User', mockManager);
      expect(() => registry.identityManagers.set('User', mockManager)).toThrow(
        "Item 'User' is already registered",
      );
    });

    it('should delete an identity manager', () => {
      registry.identityManagers.set('User', mockManager);
      registry.identityManagers.delete('User');
      expect(registry.identityManagers.has('User')).toBe(false);
    });

    it('should clear all identity managers', () => {
      registry.identityManagers.set('User', mockManager);
      registry.identityManagers.set('Post', mockManager);
      registry.identityManagers.clear();
      expect(registry.identityManagers.has('User')).toBe(false);
      expect(registry.identityManagers.has('Post')).toBe(false);
    });
  });

  describe('constructor', () => {
    it('should create a new instance', () => {
      const registry = new Registry();
      expect(registry).toBeInstanceOf(Registry);
      expect(registry.models).toBeDefined();
      expect(registry.factories).toBeDefined();
      expect(registry.identityManagers).toBeDefined();
    });
  });
});
