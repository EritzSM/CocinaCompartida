import { Given, When, Then } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight } from '@serenity-js/core';
import { Send, PostRequest, LastResponse } from '@serenity-js/rest';
import { Ensure, isPresent, equals } from '@serenity-js/assertions';

let validJwtToken = '';

// --- GIVEN ---

Given('que el cocinero {string} está registrado y tiene un JWT válido', async (actorName: string) => {
    actorCalled(actorName);
    const email = `cocinero_${Date.now()}@test.com`;
    const password = "Password123!";
    
    // Registrar usuario real para que el JWT sea válido
    await actorInTheSpotlight().attemptsTo(
        Send.a(PostRequest.to('/users').with({ username: `Chef_${Date.now()}`, email, password }))
    );
    
    // Hacer Login para obtener el token real
    await actorInTheSpotlight().attemptsTo(
        Send.a(PostRequest.to('/auth/login').with({ email, password }))
    );
    
    const body: any = await LastResponse.body().answeredBy(actorInTheSpotlight());
    validJwtToken = body.access_token || body.token || ''; // Adaptado al nombre de campo que use tu API
});

Given('el cocinero {string} está autenticado en el sistema', async (actorName: string) => {
    // Si ya hicimos el Given anterior, validJwtToken ya tiene un valor.
    actorCalled(actorName);
});

Given('que el cocinero está autenticado con JWT válido', async () => {
    actorCalled('Cocinero Anónimo');
    const email = `anonimo_${Date.now()}@test.com`;
    const password = "Password123!";
    
    await actorInTheSpotlight().attemptsTo(
        Send.a(PostRequest.to('/users').with({ username: `Anon_${Date.now()}`, email, password })),
        Send.a(PostRequest.to('/auth/login').with({ email, password }))
    );
    const body: any = await LastResponse.body().answeredBy(actorInTheSpotlight());
    validJwtToken = body.access_token || body.token || '';
});

// --- WHEN ---

When('el cocinero envía una solicitud POST a {string} con los siguientes datos:', async (endpoint: string, dataTable: any) => {
    const rows = dataTable.hashes();
    const payload: any = {};
    
    for (const row of rows) {
        let value = row.valor;
        if (value.startsWith('[') || value === 'true' || value === 'false') {
            value = JSON.parse(value);
        } else {
            value = value.replace(/^"|"$/g, '');
        }
        payload[row.campo] = value;
    }

    await actorInTheSpotlight().attemptsTo(
        Send.a(PostRequest.to(endpoint)
               .with(payload)
               .using({ headers: { Authorization: `Bearer ${validJwtToken}` } }))
    );
});

When('envía una solicitud POST a {string} sin el encabezado {string}', async (endpoint: string, header: string) => {
    // Petición limpia sin el token
    await actorInTheSpotlight().attemptsTo(
        Send.a(PostRequest.to(endpoint))
    );
});

When('el cocinero envía una solicitud POST a {string} con un token malformado', async (endpoint: string) => {
    await actorInTheSpotlight().attemptsTo(
        Send.a(PostRequest.to(endpoint).using({
            headers: { Authorization: 'Bearer super_fake_token_123' }
        }))
    );
});

When('el cocinero envía una solicitud POST a {string} omitiendo el campo {string}', async (endpoint: string, field: string) => {
    const payload: any = {
        name: "Receta Incompleta",
        descripcion: "Le falta algo",
        ingredients: ["Agua"],
        steps: ["Servir"]
    };
    delete payload[field];
    
    await actorInTheSpotlight().attemptsTo(
        Send.a(PostRequest.to(endpoint)
               .with(payload)
               .using({ headers: { Authorization: `Bearer ${validJwtToken}` } }))
    );
});

When('envía la solicitud POST a {string} omitiendo el campo {string}', async (endpoint: string, field: string) => {
    const payload: any = {
        name: "Receta Incompleta",
        descripcion: "Le falta algo",
        ingredients: ["Agua"],
        steps: ["Servir"]
    };
    delete payload[field];
    
    await actorInTheSpotlight().attemptsTo(
        Send.a(PostRequest.to(endpoint)
               .with(payload)
               .using({ headers: { Authorization: `Bearer ${validJwtToken}` } }))
    );
});

When('el cocinero envía una solicitud POST a {string} con el campo {string} vacío', async (endpoint: string, field: string) => {
    const payload: any = {
        name: "Receta con vacíos",
        descripcion: "Tiene listas vacías",
        ingredients: ["Agua"],
        steps: ["Servir"]
    };
    payload[field] = [];

    await actorInTheSpotlight().attemptsTo(
        Send.a(PostRequest.to(endpoint)
               .with(payload)
               .using({ headers: { Authorization: `Bearer ${validJwtToken}` } }))
    );
});

// --- THEN ---

Then('el cuerpo de la respuesta debe contener el campo {string}', async (field: string) => {
    const body: any = await LastResponse.body().answeredBy(actorInTheSpotlight());
    await actorInTheSpotlight().attemptsTo(
        Ensure.that(body[field], isPresent())
    );
});

Then('el cuerpo de la respuesta debe contener el campo {string} con el valor {string}', async (field: string, value: string) => {
    const body: any = await LastResponse.body().answeredBy(actorInTheSpotlight());
    await actorInTheSpotlight().attemptsTo(
        Ensure.that(body[field], equals(value))
    );
});

Then('el cuerpo de la respuesta debe contener el campo {string} como lista no vacía', async (field: string) => {
    const body: any = await LastResponse.body().answeredBy(actorInTheSpotlight());
    await actorInTheSpotlight().attemptsTo(
        Ensure.that(Array.isArray(body[field]), equals(true)),
        Ensure.that(body[field].length > 0, equals(true))
    );
});
