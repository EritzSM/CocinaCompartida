import { UploadsModule } from '../uploads/uploads.module';

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
