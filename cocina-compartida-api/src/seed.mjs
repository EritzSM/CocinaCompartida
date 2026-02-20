// seed.mjs

// La URL de tu API (asegúrate que tu backend esté corriendo)
const API_URL = 'http://localhost:3000';
const USERS_URL = `${API_URL}/users`;
const AUTH_URL = `${API_URL}/auth/login`;
const RECIPES_URL = `${API_URL}/recipes`;

// La contraseña en texto plano. Tu API se encargará de hashearla.
const plainPassword = '123456';

// Los 10 usuarios que quieres crear
const usersToCreate = [
  { username: 'admin', email: 'admin@example.com', bio: 'Soy el admin', avatar: 'logos/default.webp', role: 'admin' },
  { username: 'ana', email: 'ana@example.com', bio: 'Hola, soy Ana', avatar: 'logos/default.webp' },
  { username: 'carlos', email: 'carlos@example.com', bio: 'Fanático de la cocina', avatar: 'logos/default.webp' },
  { username: 'laura', email: 'laura@example.com', bio: 'Me gusta programar', avatar: 'logos/default.webp' },
  { username: 'miguel', email: 'miguel@example.com', bio: 'Bio de Miguel', avatar: 'logos/default.webp' },
  { username: 'sofia', email: 'sofia@example.com', bio: 'Amo los gatos', avatar: 'logos/default.webp' },
  { username: 'pablo', email: 'pablo@example.com', bio: 'Bio de Pablo', avatar: 'logos/default.webp' },
  { username: 'elena', email: 'elena@example.com', bio: 'Bio de Elena', avatar: 'logos/default.webp' },
  { username: 'diego', email: 'diego@example.com', bio: 'Bio de Diego', avatar: 'logos/default.webp' },
  { username: 'lucia', email: 'lucia@example.com', bio: 'Bio de Lucía', avatar: 'logos/default.webp' },
];

// 10 recetas base para la aplicación
const baseRecipes = [
  {
    name: 'Paella Valenciana',
    descripcion: 'El plato típico de Valencia con arroz, azafrán y una mezcla deliciosa de ingredientes.',
    ingredients: ['Arroz bomba', 'Azafrán', 'Pollo', 'Conejo', 'Judías verdes', 'Caldo de verduras', 'Pimentón', 'Cebolla', 'Tomate', 'Aceite de oliva'],
    steps: ['Dorar el pollo y conejo en aceite caliente', 'Agregar cebolla y tomate picados', 'Añadir el arroz y remover 2 minutos', 'Verter el caldo caliente con azafrán', 'Cocinar 20 minutos a fuego medio-alto', 'Dejar reposar 5 minutos sin tapar'],
    images: ['http://localhost:3000/uploads/Paella.jpg']
  },
  {
    name: 'Gazpacho Andaluz',
    descripcion: 'Sopa fría típica de Andalucía, perfecta para el verano.',
    ingredients: ['Tomates maduros', 'Pepino', 'Pimiento rojo', 'Cebolla', 'Ajo', 'Pan de molde', 'Vinagre', 'Aceite de oliva', 'Sal', 'Agua'],
    steps: ['Pelar y picar todos los vegetales', 'Remojar el pan en agua', 'Mezclar todos los ingredientes en licuadora', 'Pasar por colador fino', 'Enfriar en refrigerador 2 horas', 'Servir bien frío con hielo'],
    images: ['http://localhost:3000/uploads/Gaspacho.jpg']
  },
  {
    name: 'Ceviche Peruano',
    descripcion: 'Plato frío de pescado crudo marinado en jugo de limón.',
    ingredients: ['Filete de lenguado o mero', 'Limones frescos', 'Cebolla morada', 'Cilantro', 'Ají amarillo', 'Tomate', 'Sal y pimienta', 'Papa cocida', 'Camote'],
    steps: ['Cortar el pescado en cubos pequeños', 'Cubrir con jugo de limón fresco', 'Dejar reposar 15-20 minutos hasta que se opaque', 'Agregar cebolla, cilantro y ají', 'Sazonar con sal y pimienta', 'Servir sobre papas y camotes'],
    images: ['http://localhost:3000/uploads/Ceviche_peruano.jpg']
  },
  {
    name: 'Pasta Carbonara',
    descripcion: 'Clásico italiano cremoso sin nata, solo con huevo y queso.',
    ingredients: ['Pasta tipo espagueti', 'Guanciale o bacon', 'Huevos', 'Queso pecorino o parmesano', 'Pimienta negra', 'Sal'],
    steps: ['Cocinar la pasta en agua con sal', 'Freír el guanciale hasta estar crujiente', 'Mezclar huevos con queso rallado y pimienta', 'Colar la pasta y reservar el agua', 'Mezclar pasta caliente con guanciale', 'Agregar mezcla de huevo fuera del fuego, remover constantemente'],
    images: ['http://localhost:3000/uploads/Pasta_carbonara.jpg']
  },
  {
    name: 'Tacos al Pastor',
    descripcion: 'Deliciosos tacos mexicanos con carne marinada en especias.',
    ingredients: ['Carne de cerdo', 'Chiles guajillo', 'Vinagre', 'Especias mexicanas', 'Piña', 'Cebolla', 'Cilantro', 'Tortillas de maíz', 'Limón'],
    steps: ['Preparar adobo con chiles, vinagre y especias', 'Marinar la carne en adobo 4 horas', 'Colocar carne en asador vertical con piña encima', 'Cocinar hasta que la carne esté bien cocida', 'Cortar finamente en secciones', 'Servir en tortillas con cebolla y cilantro'],
    images: ['http://localhost:3000/uploads/tacos-al-pastor.jpg']
  },
  {
    name: 'Escargots a la Borgoña',
    descripcion: 'Caracoles típicos franceses con mantequilla aromática.',
    ingredients: ['Caracoles enlatados', 'Mantequilla', 'Ajo', 'Perejil fresco', 'Cebollino', 'Vino blanco', 'Caldo de verduras', 'Pan tostado', 'Sal y pimienta'],
    steps: ['Escurrir bien los caracoles', 'Preparar mantequilla con ajo y perejil picado', 'Colocar caracol en concha, rellenar con mantequilla', 'Hornear a 200°C durante 5-7 minutos', 'Acompañar con pan tostado marcado en sartén', 'Servir de inmediato'],
    images: ['http://localhost:3000/uploads/Escargots.JPG']
  },
  {
    name: 'Ramen Japonés',
    descripcion: 'Sopa japonesa tradicional con fideos, caldo y toppings variados.',
    ingredients: ['Fideos ramen', 'Caldo de pollo o dashi', 'Huevo', 'Jamón japonés', 'Espinacas', 'Cebollino', 'Brotes de soya', 'Champiñones', 'Miso', 'Salsa de soya'],
    steps: ['Preparar caldo con dashi y miso', 'Cocinar fideos ramen según instrucciones', 'Cocinar huevo suave 6-7 minutos y pelar', 'Saltear espinacas y champiñones', 'Verter caldo caliente en tazón', 'Agregar fideos y todos los toppings'],
    images: ['http://localhost:3000/uploads/Ramen.jpg']
  },
  {
    name: 'Risotto de Setas',
    descripcion: 'Plato italiano cremoso con arroz y hongos frescos.',
    ingredients: ['Arroz arborio', 'Setas variadas', 'Caldo de verduras caliente', 'Vino blanco seco', 'Cebolla', 'Ajo', 'Parmesano', 'Mantequilla', 'Aceite de oliva'],
    steps: ['Saltear cebolla y ajo en aceite', 'Agregar setas cortadas y cocinar 3 minutos', 'Incorporar arroz y tostar 2 minutos', 'Verter vino blanco y dejar evaporar', 'Añadir caldo poco a poco, remover constantemente', 'Cuando el arroz esté cremoso, agregar mantequilla y queso'],
    images: ['http://localhost:3000/uploads/Risotto.jpg']
  },
  {
    name: 'Hummus Casero',
    descripcion: 'Dip de garbanzos cremoso y delicioso, típico del Medio Oriente.',
    ingredients: ['Garbanzos enlatados', 'Tahini', 'Limón fresco', 'Ajo', 'Agua fría', 'Aceite de oliva', 'Paprika', 'Sal', 'Perejil'],
    steps: ['Escurrir bien los garbanzos', 'Colocar garbanzos, tahini, ajo y limón en licuadora', 'Procesar agregando agua poco a poco', 'Conseguir consistencia cremosa', 'Pasar a recipiente y hacer un hueco', 'Verter aceite de oliva y espolvorear paprika'],
    images: ['http://localhost:3000/uploads/Hummus.jpg']
  },
  {
    name: 'Pad Thai',
    descripcion: 'Noodles tailandeses con camarones, tofu y sabor agridulce.',
    ingredients: ['Fideos de arroz', 'Camarones', 'Tofu firme', 'Huevo', 'Brotes de soya', 'Cacahuete molido', 'Salsa de pescado', 'Jugo de limón', 'Azúcar morena', 'Cebollino'],
    steps: ['Cocinar y escurrir bien los fideos de arroz', 'Saltear tofu y camarones en wok caliente', 'Apartar y añadir huevo batido', 'Agregar fideos, salsa de pescado, limón y azúcar', 'Mezclar bien todos los ingredientes', 'Servir con brotes de soya, cacahuete y cebollino'],
    images: ['http://localhost:3000/uploads/PadThai.jpg']
  }
];

async function createUsers() {
  console.log('--- Iniciando creación de usuarios ---');

  for (const userData of usersToCreate) {
    // Combinamos los datos del usuario con la contraseña
    const fullUserData = {
      ...userData,
      password: plainPassword,
    };

    try {
      const response = await fetch(USERS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullUserData),
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`✅ Éxito: Usuario '${result.username}' creado.`);
      } else {
        // Manejamos errores de la API (ej. "Username exists")
        console.warn(`⚠️ Advertencia: No se pudo crear '${userData.username}'. Razón: ${result.message}`);
      }
    } catch (error) {
      console.error(`❌ Error fatal creando '${userData.username}': ${error.message}`);
    }
  }
  console.log('--- Proceso de creación de usuarios terminado ---');
}

async function loginAdmin() {
  console.log('--- Iniciando login de admin ---');
  try {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: plainPassword,
      }),
    });

    const result = await response.json();

    if (response.ok && result.token) {
      console.log(`✅ Login exitoso para admin`);
      return result.token;
    } else {
      console.error(`❌ Error en login: ${result.message}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error fatal en login: ${error.message}`);
    return null;
  }
}

async function createBaseRecipes(token) {
  if (!token) {
    console.error('❌ No hay token disponible, no se pueden crear recetas');
    return;
  }

  console.log('--- Iniciando creación de 10 recetas base ---');

  for (const recipeData of baseRecipes) {
    try {
      const response = await fetch(RECIPES_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(recipeData),
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`✅ Éxito: Receta '${result.name}' creada.`);
      } else {
        console.warn(`⚠️ Advertencia: No se pudo crear la receta "${recipeData.name}". Razón: ${result.message}`);
      }
    } catch (error) {
      console.error(`❌ Error fatal creando receta "${recipeData.name}": ${error.message}`);
    }
  }
  console.log('--- Proceso de creación de recetas terminado ---');
}

async function main() {
  await createUsers();
  const token = await loginAdmin();
  await createBaseRecipes(token);
  console.log('\n✅ ¡Seeding completado!');
}

// Ejecutamos la función
main();