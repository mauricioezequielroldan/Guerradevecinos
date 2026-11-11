// ============================================================
// MODO HISTORIA — DATOS: "UNA NOCHE SIN LUZ"
// Acá están todos los textos. Se pueden cambiar sin tocar el funcionamiento (historia_barrio.js).
// quien: índice del compañero en La Par (0 Rubén, 1 Cacho, 2 Tito, 3 La Colo)
// donde: posición en el barrio (x, z) donde espera el compañero. lugar: [x, z, radio, texto] adónde hay que ir para arrancar
// rival: banda rival ('original' = La Impar); mapa: 'plaza' o 'trofi'; tam: 3 o 4 por equipo
// ============================================================
const HISTORIA = {
  titulo: 'UNA NOCHE SIN LUZ',
  prologo: [
    'Barrio Las Acacias. 23:40.',
    'Se corta la luz en todo el barrio. Ni un farol, ni una heladera, ni el ventilador de Doña Chola.',
    'En la oscuridad empiezan a correr mensajes raros. Notas, audios, chismes. Alguien está metiendo púa entre las bandas.',
    'Rubén sale a la vereda. Si el barrio se va a pelear esta noche, que La Par esté junta.'
  ],
  misiones: [
    {
      id: 'm1', quien: 2, donde: [-11, 5.0], lugar: [26, -26, 15, 'Andá a LA PLAZA'], nombre: 'LA PLAZA ES NUESTRA', rival: 'original', mapa: 'plaza', tam: 3,
      resumen: 'La Impar dice que sin luz la plaza es de ellos.', premio: { plata: 300, respeto: 1 },
      antes: [
        ['Tito', '¡Rubén! Che, haceme la gamba, que se pudrió todo con Carlos.'],
        ['Rubén', '¿Qué Carlos?'],
        ['Tito', 'El Tano, boludo. Carlos le dice la madre nomás.'],
        ['Tito', 'Dice que sin luz la plaza es de La Impar, y que nosotros le pinchamos las gomas de la moto. Alguien le fue con el cuento.'],
        ['Rubén', 'Nosotros no fuimos. Pero si el Tano quiere la plaza, que venga a buscarla. Vamos para allá.'],
        ['Tito', 'Te espero en la plaza. Está acá nomás, cruzando la esquina.']
      ],
      despues: [
        ['Tito', '¡Ni con luz ni sin luz nos ganan!'],
        ['Tito', 'Igual... antes de irse, el Tano me mostró una nota. Decía "La Plaza es de La Par. Firmado: La Par".'],
        ['Rubén', 'Nosotros no escribimos notas. Ni sabemos dónde quedó la birome.'],
        ['Tito', 'Entonces alguien quiere que nos agarremos con todos. Andá a ver a La Colo, que está en el kiosco y estaba rara.']
      ]
    },
    {
      id: 'm2', quien: 3, donde: [-10, -5.0], lugar: [34, 2.6, 2.4, 'Andá a la PARADA DEL REMÍS'], remis: true, nombre: 'SALIDA DEL TROFI', rival: 'cumbieros', mapa: 'trofi', tam: 4,
      resumen: 'La Colo se va a bailar al Trofi Cambio. A la salida, los Cumbieros la están esperando.', premio: { plata: 500, respeto: 2 },
      antes: [
        ['La Colo', 'Rubén, ¿sabés cuál es el único lugar con generador esta noche? El Trofi.'],
        ['La Colo', 'Yo me voy a bailar. Pedí un remís... dice que tarda cuarenta minutos y que lleva a cuatro "apretados".'],
        ['Rubén', 'Te acompañamos. Pero a la salida no te despegues de nosotros.'],
        ['La Colo', 'Por eso te busqué. Los Cumbieros me mandaron un mensaje: que hoy el Trofi es de ellos y que La Par no pisa la vereda.'],
        ['Rubén', '¿Un mensaje de quién?'],
        ['La Colo', 'De un número desconocido. Con foto de perfil de un pancho.'],
        ['La Colo', 'Vení, vamos a la parada de la remisería, que ya pedí el auto.']
      ],
      despues: [
        ['La Colo', '¡Bailé tres temas y me peleé ocho! Noche completa.'],
        ['La Colo', 'Lo raro es que el Rulo me juró que a ellos también les llegó un mensaje: que nosotros les íbamos a romper el auto.'],
        ['Rubén', 'El mismo número del pancho, seguro. Alguien nos está usando de títeres.'],
        ['La Colo', 'Cacho dice que sabe algo. Pero se fue a preparar las cañas: mañana se va a pescar al Gualeguay.']
      ]
    },
    {
      id: 'm3', quien: 1, donde: [4.8, 25.5], nombre: 'PESCA EN EL GUALEGUAY', bloqueada: true,
      resumen: 'Cacho se va a pescar a Entre Ríos. Los Gauchos dicen que esa orilla es de ellos. (Próximamente)',
      antes: [
        ['Cacho', 'Rubén, mañana temprano me voy a pescar al Gualeguay. Ya tengo las lombrices.'],
        ['Cacho', 'Y escuchá: en Entre Ríos también llegaron mensajes del pancho. Los Gauchos andan con la daga afilada.'],
        ['Rubén', 'Entonces vamos con vos.'],
        ['Cacho', 'Cuando esté lista la camioneta te aviso. (Esta misión llega en la próxima versión.)']
      ]
    }
  ],
  final: [
    ['Rubén', 'Ya está. Lo que pasó esta noche no termina acá.'],
    ['Rubén', 'Hay alguien con foto de pancho que tiene muchas ganas de que el barrio se pelee entero.'],
    ['Rubén', 'Mañana lo encontramos. (Continuará...)']
  ]
};
