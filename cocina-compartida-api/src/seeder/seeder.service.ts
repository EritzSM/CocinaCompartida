import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Recipe } from '../recipes/entities/recipe.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  private async seed() {
    const recipesCount = await this.recipeRepository.count();
    
    if (recipesCount >= 10) {
      this.logger.log('Ya hay suficientes recetas (' + recipesCount + ') en base de datos, saltando el seeder...');
      return;
    }

    this.logger.log('Iniciando el precargado de recetas...');

    // 1. Crear el usuario Chef Maestro si no existe
    let user = await this.userRepository.findOne({ where: { username: 'ChefMaestro' } });
    if (!user) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = this.userRepository.create({
        username: 'ChefMaestro',
        password: hashedPassword,
        email: 'chef@cocinacompartida.com',
        bio: 'Me encanta compartir las recetas más ricas y clásicas.',
        role: 'user',
        isActive: true,
      });
      user = await this.userRepository.save(user);
      this.logger.log('Usuario ChefMaestro creado.');
    }

    // 2. Definir las 10 recetas (con datos variados y URLs de imágenes estéticas y funcionales)
    const seedRecipes = [
      {
        name: 'Tacos al Pastor',
        descripcion: 'Auténticos tacos mexicanos con cerdo marinado, piña y cilantro fresco. Ideales para compartir en una cena con amigos.',
        ingredients: ['1kg Pierna de cerdo', '1 Piña', 'Cilantro fresco', 'Cebolla blanca', 'Tortillas de maíz', 'Salsa taquera'],
        steps: ['Marinar la carne por al menos 4 horas.', 'Cocinar a fuego alto simulando el trompo.', 'Cortar la piña en trozos pequeños.', 'Calentar las tortillas.', 'Servir con cilantro, cebolla y salsa al gusto.'],
        images: ['https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80'],
        tags: ['Mexicana', 'Cena', 'Carne'],
        category: 'platos-fuertes',
        likes: 120,
        likedBy: [],
        user: user,
      },
      {
        name: 'Paella Valenciana',
        descripcion: 'El platillo español por excelencia. Una mezcla perfecta de mariscos frescos, azafrán y arroz bomba. ¡Una delicia!',
        ingredients: ['400g Arroz bomba', 'Caldo de pescado', 'Azafrán', 'Langostinos', 'Mejillones', 'Calamar', 'Tomate triturado'],
        steps: ['Sofreír el calamar y el tomate.', 'Añadir el arroz y tostar unos minutos.', 'Verter el caldo caliente con el azafrán.', 'Colocar los mariscos por encima.', 'Dejar cocer sin remover hasta que el caldo se absorba.'],
        images: ['https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800&q=80'],
        tags: ['Española', 'Mariscos', 'Almuerzo'],
        category: 'platos-fuertes',
        likes: 340,
        likedBy: [],
        user: user,
      },
      {
        name: 'Pizza Margherita Casera',
        descripcion: 'Pizza tradicional italiana con masa fina, salsa de tomate natural, mozzarella de búfala fresca y hojas de albahaca recién cortadas.',
        ingredients: ['Masa de pizza', 'Salsa de tomate casera', 'Mozzarella fresca', 'Albahaca', 'Aceite de oliva virgen extra'],
        steps: ['Precalentar el horno a máxima temperatura (preferiblemente 250°C o más).', 'Estirar la masa en una superficie enharinada.', 'Añadir la salsa y distribuir la mozzarella en trozos.', 'Hornear por unos 8-10 minutos hasta que los bordes doren.', 'Sacar del horno y coronar con albahaca fresca.'],
        images: ['https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80'],
        tags: ['Italiana', 'Cena', 'Vegetariano'],
        category: 'platos-fuertes',
        likes: 560,
        likedBy: [],
        user: user,
      },
      {
        name: 'Sushi de Salmón (Maki y Nigiri)',
        descripcion: 'Prepárate para hacer sushi en casa. Arroz avinagrado perfectamente condimentado junto al mejor salmón fresco crudo.',
        ingredients: ['Arroz para sushi', 'Vinagre de arroz', 'Alga Nori', 'Salmón fresco grado sushi', 'Salsa de soja', 'Wasabi'],
        steps: ['Lavar muy bien el arroz y cocinarlo tapado a fuego lento.', 'Aderezar el arroz con una mezcla tibia de vinagre, sal y azúcar.', 'Cortar el salmón en tiras gruesas y láminas.', 'Armar los rollos y cortar con cuchillo muy afilado mojado.', 'Servir con salsa de soja y wasabi frescos.'],
        images: ['https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80'],
        tags: ['Japonesa', 'Pescado', 'Cena'],
        category: 'platos-fuertes',
        likes: 89,
        likedBy: [],
        user: user,
      },
      {
        name: 'Hamburguesa Doble Smash',
        descripcion: 'La hamburguesa americana definitiva. Dos carnes de res aplastadas y jugosas con una costra dorada, mucho queso y pan brioche súper suave.',
        ingredients: ['Carne de res 80/20', 'Pan Brioche', 'Queso Cheddar', 'Cebolla caramelizada', 'Salsa secreta burger', 'Pepinillos'],
        steps: ['Hacer bolitas pequeñas con la carne (aprox. 80g).', 'En una plancha extremadamente caliente, aplastar la bolita.', 'Condimentar con abundante sal y pimienta de inmediato.', 'Añadir queso justo un minuto antes de sacar y colocar una encima de la otra.', 'Armar dentro del pan ligeramente tostado.'],
        images: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80'],
        tags: ['Americana', 'Comida Rápida', 'Carne'],
        category: 'platos-fuertes',
        likes: 412,
        likedBy: [],
        user: user,
      },
      {
        name: 'Ensalada César Original',
        descripcion: 'La icónica ensalada con su aderezo original casero. Sin pollo, tal cual como se inventó para un sabor crujiente y fresco.',
        ingredients: ['Lechuga orejona/romana', 'Crutones de pan de ajo', 'Queso Parmigiano', 'Yema de huevo', 'Mostaza Dijon', 'Anchoas', 'Ajo', 'Aceite'],
        steps: ['Preparar el aderezo machacando ajo, anchoas y mezclando con yema y mostaza.', 'Emulsionar agregando el aceite en un hilo.', 'Trocear la lechuga lavada y muy seca con las manos.', 'Tirar el aderezo, abundantes crutones y lascas de queso.', 'Mezclar suavemente y servir de inmediato.'],
        images: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80'],
        tags: ['Saludable', 'Ensalada', 'Vegetariano'],
        category: 'entradas',
        likes: 125,
        likedBy: [],
        user: user,
      },
      {
        name: 'Brownies Húmedos de Chocolate Fudgy',
        descripcion: 'Los brownies con los bordes más crujientes y el interior más pegajoso y húmedo que vas a probar. Un sueño para los amantes del chocolate intenso.',
        ingredients: ['Chocolate semi amargo 70%', 'Mantequilla', 'Huevos', 'Azúcar blanca', 'Harina refinada', 'Cacao en polvo'],
        steps: ['Derretir la mantequilla con el chocolate a baño maría suave.', 'Batir mucho los huevos con el azúcar hasta que formen "letra".', 'Mezclar envolventemente con el chocolate derretido.', 'Hornear a temperatura media-baja (170°C) unos 25 minutos.', 'Enfriar totalmente antes de cortar.'],
        images: ['https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80'],
        tags: ['Postres', 'Dulce', 'Chocolate'],
        category: 'postres',
        likes: 1304,
        likedBy: [],
        user: user,
      },
      {
        name: 'Pollo al Curry con Leche de Coco',
        descripcion: 'Un plato exótico y cremoso. Mezcla una sinfonía de especias con la suavidad del coco, ideal para disfrutar con arroz blanco humeante.',
        ingredients: ['Pechuga de pollo', 'Curry en polvo', 'Leche de coco completa', 'Cebolla', 'Ajo', 'Jengibre rallado', 'Arroz jazmín'],
        steps: ['Dorar los dados de pollo y retirarlos brevemente.', 'Sofreír cebolla, ajo y jengibre hasta que estén fragantes.', 'Incorporar el curry y dejar cocinar 1 minuto.', 'Verter la leche de coco, regresar el pollo y espesar.', 'Servir junto a arroz blanco de jazmín.'],
        images: ['https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80'],
        tags: ['Asiática', 'Pollo', 'Especiado'],
        category: 'platos-fuertes',
        likes: 215,
        likedBy: [],
        user: user,
      },
      {
        name: 'Tarta de Queso Variante San Sebastián',
        descripcion: 'La tarta de queso de estilo quemado. Famosa mundialmente, no necesitas base de galleta y es extremadamente cremosa por dentro.',
        ingredients: ['Queso crema tipo Philadelphia', 'Huevos', 'Nata (crema de leche)', 'Azúcar', 'Harina (poca)'],
        steps: ['Forrar un molde con papel de horno arrugado.', 'Batir suavemente todos los ingredientes en un bowl hasta integrar.', 'Verter sobre el molde, dando unos golpes para sacar el aire.', 'Hornear a 210°C hasta que la parte superior parezca quemada y oscurecida.', 'Dejar enfriar unas horas y servir.'],
        images: ['https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&q=80'],
        tags: ['Postres', 'Española', 'Dulce'],
        category: 'postres',
        likes: 955,
        likedBy: [],
        user: user,
      },
      {
        name: 'Ceviche Mixto Peruano',
        descripcion: 'Una de las maravillas de todas las gastronomías latinas. Pescado marinado, equilibrado con limón, cilantro, conchas y calamar en una leche de tigre explosiva.',
        ingredients: ['Pescado blanco firme', 'Calamar y camarones blanqueados', 'Limones o limas', 'Cebolla morada', 'Cilantro', 'Ají limo', 'Canchita (Maíz)'],
        steps: ['Licuar recortes del pescado, limón, ají, cebolla y ajo para la base (leche de tigre).', 'Cortar el pescado en dados perfectos y la cebolla en juliana fina.', 'Mezclar suavemente en un bol frío los mariscos, el pescado y el ají limo.', 'Verter el jugo, mezclar rápidamente por solo unos minutos.', 'Incorporar cebolla, cilantro y servir con maíz tostado de inmediato.'],
        images: ['https://images.unsplash.com/photo-1535400255456-984241443b29?w=800&q=80'],
        tags: ['Peruana', 'Mariscos', 'Saludable'],
        category: 'entradas',
        likes: 671,
        likedBy: [],
        user: user,
      }
    ];

    const recipesEntities = this.recipeRepository.create(seedRecipes);
    await this.recipeRepository.save(recipesEntities);
    this.logger.log('Las 10 recetas han sido precargadas exitosamente.');
  }
}
