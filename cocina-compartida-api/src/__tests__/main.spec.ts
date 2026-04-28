jest.mock(
  '@supabase/supabase-js',
  () => ({
    createClient: jest.fn(),
  }),
  { virtual: true },
);

const nextTick = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('Main Bootstrap', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.PORT;
  });

  it('Bootstrap_CuandoSeEjecuta_DebeConfigurarAppYEscuchar', async () => {
    // Arrange
    const appMock = {
      useGlobalPipes: jest.fn(),
      enableCors: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    };
    const createMock = jest.fn().mockResolvedValue(appMock);

    jest.doMock('@nestjs/core', () => ({
      NestFactory: { create: createMock },
    }));

    process.env.PORT = '3100';

    let AppModuleRef: any;

    // Act
    jest.isolateModules(() => {
      AppModuleRef = require('../app.module').AppModule;
      require('../main');
    });
    await nextTick();

    // Assert
    expect(createMock).toHaveBeenCalledWith(AppModuleRef);
    const pipeArg = appMock.useGlobalPipes.mock.calls[0][0];
    expect(pipeArg).toEqual(
      expect.objectContaining({
        exceptionFactory: expect.any(Function),
      }),
    );
    expect(appMock.enableCors).toHaveBeenCalledWith({
      origin: ['http://localhost:4200', 'http://localhost:8081'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });
    expect(appMock.listen).toHaveBeenCalledWith('3100');
  });
});
