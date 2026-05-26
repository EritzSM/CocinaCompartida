module.exports = {
  // Desactiva los comandos visuales de Applitools si no se ha definido una API Key en la consola.
  // Esto evita que Cypress arroje el error "Please provide an API key..." y permite que los tests
  // sigan corriendo su lógica normal E2E sin interrupciones.
  isDisabled: !process.env.APPLITOOLS_API_KEY
};
