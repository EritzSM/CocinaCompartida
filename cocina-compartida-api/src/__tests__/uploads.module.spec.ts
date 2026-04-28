import { UploadsModule } from '../uploads/uploads.module';

jest.mock(
  '@supabase/supabase-js',
  () => ({
    createClient: jest.fn(),
  }),
  { virtual: true },
);

describe('UploadsModule', () => {
  it('UploadsModule_CuandoSeImporta_DebeEstarDefinido', () => {
    // Arrange
    const moduleRef = UploadsModule;

    // Act
    const result = moduleRef !== undefined;

    // Assert
    expect(result).toBe(true);
  });
});
