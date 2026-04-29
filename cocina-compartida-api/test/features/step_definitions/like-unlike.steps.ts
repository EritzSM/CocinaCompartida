import { Given, When, Then } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight } from '@serenity-js/core';
import { Send, PostRequest, LastResponse } from '@serenity-js/rest';
import { Ensure, equals } from '@serenity-js/assertions';

// --- GIVEN ---

Given('que existe una receta con id {string} publicada por {string}', async (recipeId: string, author: string) => {
    // TODO: Implementar preparación de la base de datos
});

Given('que el usuario {string} está registrado y tiene un JWT válido', async (actorName: string) => {
    actorCalled(actorName);
    // TODO: Simular inicio de sesión o inyectar JWT válido en el actor
});

Given('que el usuario {string} NO ha dado like a la receta {string}', async (actorName: string, recipeId: string) => {
    // TODO: Asegurar estado en BD
});

Given('que el usuario {string} YA dio like a la receta {string}', async (actorName: string, recipeId: string) => {
    // TODO: Insertar like previo en BD
});

Given('que el visitante NO está autenticado', async () => {
    actorCalled('visitante');
});

Given('que el usuario {string} tiene un JWT válido', async (actorName: string) => {
    actorCalled(actorName);
});

Given('que la receta {string} existe', async (recipeId: string) => {
    // TODO: Asegurar que exista la receta
});

// --- WHEN ---

When('envía una solicitud POST a {string}', async (endpoint: string) => {
    await actorInTheSpotlight().attemptsTo(
        Send.a(PostRequest.to(endpoint))
    );
});

When('{string} envía POST a {string} por primera vez', async (actorName: string, endpoint: string) => {
    await actorCalled(actorName).attemptsTo(
        Send.a(PostRequest.to(endpoint))
    );
});

When('{string} envía POST a {string} por segunda vez', async (actorName: string, endpoint: string) => {
    await actorCalled(actorName).attemptsTo(
        Send.a(PostRequest.to(endpoint))
    );
});

When('el encabezado {string} contiene {string}', async (header: string, value: string) => {
    // En Serenity/JS los headers se suelen mandar junto con el PostRequest.
    // Esto es un placeholder para futuras mejoras.
});

When('envía una solicitud POST a {string} sin encabezado {string}', async (endpoint: string, header: string) => {
    await actorInTheSpotlight().attemptsTo(
        Send.a(PostRequest.to(endpoint))
    );
});

When('envía una solicitud POST a {string} con un token malformado', async (endpoint: string) => {
    await actorInTheSpotlight().attemptsTo(
        Send.a(PostRequest.to(endpoint).using({
            headers: { Authorization: 'Bearer token-invalido' }
        }))
    );
});

When('da like a la receta \\(primer POST)', async () => {
    await actorInTheSpotlight().attemptsTo(
        Send.a(PostRequest.to('/recipes/receta-abc-123/like'))
    );
});

When('luego quita el like a la receta \\(segundo POST)', async () => {
    await actorInTheSpotlight().attemptsTo(
        Send.a(PostRequest.to('/recipes/receta-abc-123/like'))
    );
});

// --- THEN ---

Then('debe recibir una respuesta con código HTTP {int}', async (expectedStatusCode: number) => {
    await actorInTheSpotlight().attemptsTo(
        Ensure.that(LastResponse.status(), equals(expectedStatusCode))
    );
});

Then('el cuerpo de la respuesta debe indicar que el like fue agregado', async () => {
    // TODO: Extraer y afirmar cuerpo
});

Then('el contador de likes de la receta debe haber incrementado en {int}', async (amount: number) => {
    // TODO: Verificar base de datos o respuesta
});

Then('el cuerpo de la respuesta debe indicar que el like fue eliminado', async () => {
    // TODO: Extraer y afirmar cuerpo
});

Then('el contador de likes de la receta debe haber decrementado en {int}', async (amount: number) => {
    // TODO: Verificar base de datos o respuesta
});

Then('el contador de likes debe estar en el mismo valor que al inicio', async () => {
    // TODO: Verificar estado previo vs actual
});

Then('el cuerpo de la respuesta debe contener el mensaje {string}', async (message: string) => {
    // TODO: Extraer mensaje y verificar
});

Then('el mensaje de error debe indicar {string}', async (message: string) => {
    // TODO: Extraer error y verificar
});

Then('el estado del like para {string} debe ser {string}', async (actorName: string, expectedState: string) => {
    // TODO: Hacer GET a la receta o BD para verificar estado
});
