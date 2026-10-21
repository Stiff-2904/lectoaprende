// Banco breve de actividades para primer grado. Las respuestas sólo se devuelven al servidor.
const make = (moduleId, n, title, instruction, prompt, options, correctAnswer, correct, incorrect, extra = {}) => ({
  id:`m${moduleId}-e${n}`, moduleId,
  type: moduleId === 4 ? 'order-syllables' : moduleId === 3 ? 'build-syllable' : 'single-choice',
  title, instruction, prompt, options, correctAnswer,
  feedback:{correct, incorrect}, ...extra
});
const exercises = [
  // Letras: el ejemplo oral contextualiza la letra sin fingir que el TTS pronuncia fonemas aislados.
  make(1,1,'M de mano','Busca la letra inicial de mano. Mano comienza con M.','¿Con qué letra empieza MANO?',['M','P','S','L'],'M','¡Muy bien! Mano comienza con M.','Escucha: mano comienza con M. Vuelve a mirar.'),
  make(1,2,'P de pato','Escucha la palabra pato. Pato comienza con P.','¿Con qué letra empieza PATO?',['B','P','T','M'],'P','¡Genial! Pato comienza con P.','Casi. La palabra pato comienza con P.'),
  make(1,3,'S de sol','Escucha: sol. Sol comienza con S.','¿Cuál es la primera letra de SOL?',['S','L','M','A'],'S','¡Exacto! S es la primera letra de sol.','Intenta de nuevo. Sol comienza con S.'),
  make(1,4,'L de luna','Escucha la palabra luna. Luna comienza con L.','¿Con qué letra empieza LUNA?',['P','T','L','S'],'L','¡Excelente! Luna empieza con L.','Muy cerca. Escucha: luna empieza con L.'),
  make(1,5,'T de taza','Escucha: taza. Taza comienza con T.','¿Con qué letra empieza TAZA?',['M','T','D','P'],'T','¡Fantástico! Taza comienza con T.','Puedes lograrlo. Taza comienza con T.'),
  // Discriminación visual (no se atribuyen sonidos distintos a b y v en español latinoamericano).
  make(2,1,'Encuentra la b','Observa las letras. Busca la b minúscula, como en bota.','Toca la letra b.',['b','d'],'b','¡Bien! Encontraste la b.','Mira con calma: la b tiene el palito primero.'),
  make(2,2,'Encuentra la d','Observa las letras. Busca la d minúscula, como en dado.','Toca la letra d.',['b','d'],'d','¡Perfecto! Encontraste la d.','Fíjate: en la d, el círculo va primero.'),
  make(2,3,'Encuentra la p','Busca la p minúscula, como en pato.','Toca la letra p.',['p','q'],'p','¡Lo conseguiste! Encontraste la p.','Observa la forma y vuelve a intentarlo.'),
  make(2,4,'Encuentra la q','Busca la q minúscula, como en queso.','Toca la letra q.',['p','q'],'q','¡Muy bien! Esa es la q.','Mira la dirección de su palito.'),
  make(2,5,'Encuentra la m','Busca la m minúscula, como en mamá.','Toca la letra m.',['n','m'],'m','¡Bravo! Encontraste la m.','La m tiene dos montañitas. Intenta otra vez.'),
  // Sílabas consonante-vocal. El texto explica la combinación con voz natural.
  make(3,1,'Formo MA','Junta M con A. M con A forma MA.','M + ___ = MA',['A','E','O','U'],'A','¡Muy bien! Formaste MA.','Escucha: M con A, MA. Busca A.'),
  make(3,2,'Formo PE','Junta P con E. P con E forma PE.','P + ___ = PE',['I','A','E','O'],'E','¡Excelente! Formaste PE.','Escucha: P con E, PE. Busca E.'),
  make(3,3,'Formo SI','Junta S con I. S con I forma SI.','S + ___ = SI',['I','U','O','A'],'I','¡Lo lograste! Formaste SI.','S con I forma SI. Busca I.'),
  make(3,4,'Formo LO','Junta L con O. L con O forma LO.','L + ___ = LO',['E','O','I','U'],'O','¡Genial! Formaste LO.','L con O forma LO. Busca O.'),
  make(3,5,'Formo TU','Junta T con U. T con U forma TU.','T + ___ = TU',['A','E','I','U'],'U','¡Perfecto! Formaste TU.','T con U forma TU. Busca U.'),
  // Palabras de dos sílabas; la pista textual y visual facilita comprensión.
  make(4,1,'La mesa','Ordena las sílabas me y sa para formar la palabra mesa.','Forma la palabra MESA.',['SA','ME'],['ME','SA'],'¡Excelente! Formaste MESA.','Prueba primero ME y después SA.',{visualHint:'🪑',wordHint:'MESA'}),
  make(4,2,'La sopa','Ordena las sílabas so y pa para formar la palabra sopa.','Forma la palabra SOPA.',['PA','SO'],['SO','PA'],'¡Muy bien! Formaste SOPA.','Escucha: SO, PA. Intenta de nuevo.',{visualHint:'🥣',wordHint:'SOPA'}),
  make(4,3,'La luna','Ordena las sílabas lu y na para formar la palabra luna.','Forma la palabra LUNA.',['NA','LU'],['LU','NA'],'¡Qué bien! Formaste LUNA.','Escucha: LU, NA. Intenta otra vez.',{visualHint:'🌙',wordHint:'LUNA'}),
  make(4,4,'El sapo','Ordena las sílabas sa y po para formar la palabra sapo.','Forma la palabra SAPO.',['PO','SA'],['SA','PO'],'¡Bravo! Formaste SAPO.','Escucha: SA, PO. Intenta otra vez.',{visualHint:'🐸',wordHint:'SAPO'}),
  make(4,5,'La pelota','Ordena las sílabas pe, lo y ta para formar la palabra pelota.','Forma la palabra PELOTA.',['TA','PE','LO'],['PE','LO','TA'],'¡Fantástico! Formaste PELOTA.','Recuerda: PE, LO, TA.',{visualHint:'⚽',wordHint:'PELOTA'}),
  // Mundo 5: vocales ausentes: completar y leer palabras en contexto.
  make(5,1,'El sol','La palabra SOL perdió una vocal. Escucha: sol. Busca la O.','S _ L  =  SOL',['A','O','E','U'],'O','¡Sí! SOL lleva la vocal O.','Di sol despacito y busca la O.',{type:'fill-vowel',visualHint:'☀️'}),
  make(5,2,'La casa','La palabra CASA perdió una vocal. Busca la A.','C _ SA  =  CASA',['A','I','O','E'],'A','¡Genial! CASA lleva A.','Escucha: ca-sa. La vocal que falta es A.',{type:'fill-vowel',visualHint:'🏠'}),
  make(5,3,'El pato','Escucha: pato. Completa PATO con la vocal A.','P _ TO  =  PATO',['E','O','A','U'],'A','¡Muy bien! Es PATO.','Escucha: pa-to. Falta la A.',{type:'fill-vowel',visualHint:'🦆'}),
  make(5,4,'La luna','Escucha: luna. Completa LUNA con la vocal U.','L _ NA  =  LUNA',['U','A','E','I'],'U','¡Bravo! Es LUNA.','Lu-na empieza con la vocal U después de L.',{type:'fill-vowel',visualHint:'🌙'}),
  make(5,5,'La mesa','Escucha: mesa. Completa MESA con la vocal E.','M _ SA  =  MESA',['I','A','E','O'],'E','¡Excelente! Es MESA.','Escucha: me-sa. La vocal que falta es E.',{type:'fill-vowel',visualHint:'🪑'}),
  // Mundo 6: escuchar, comparar y relacionar terminaciones sonoras.
  make(6,1,'Gato y pato','Di en voz alta GATO. ¿Qué palabra suena parecida al final?','¿Qué rima con GATO?',['MESA','PATO','LUNA'],'PATO','¡Eso es! GATO rima con PATO.','Escucha: ga-to y pa-to suenan parecido.',{type:'rhyme-match',visualHint:'🐱 🦆'}),
  make(6,2,'Luna y cuna','Di LUNA despacito. Busca una palabra que termine igual.','¿Qué rima con LUNA?',['CUNA','PATO','SOL'],'CUNA','¡Muy bien! LUNA rima con CUNA.','Escucha: lu-na y cu-na.',{type:'rhyme-match',visualHint:'🌙 🛏️'}),
  make(6,3,'Sapo y trapo','Escucha: SAPO. ¿Cuál palabra tiene una terminación parecida?','¿Qué rima con SAPO?',['TREN','TRAPO','CASA'],'TRAPO','¡Excelente! SAPO y TRAPO riman.','Escucha: sa-po, tra-po.',{type:'rhyme-match',visualHint:'🐸 🧽'}),
  make(6,4,'Mesa y fresa','Pronuncia MESA. Busca otra palabra que termine en ESA.','¿Qué rima con MESA?',['FRESA','LUNA','BOTÓN'],'FRESA','¡Genial! MESA y FRESA riman.','Me-sa y fre-sa tienen un final parecido.',{type:'rhyme-match',visualHint:'🪑 🍓'}),
  make(6,5,'Ratón y botón','Escucha: RATÓN. Busca otra palabra que termine en ÓN.','¿Qué rima con RATÓN?',['SAPO','BOTÓN','TAZA'],'BOTÓN','¡Fantástico! RATÓN rima con BOTÓN.','Escucha las terminaciones: ra-tón y bo-tón.',{type:'rhyme-match',visualHint:'🐭 🔘'}),
  // Mundo 7: palmadas imaginarias y sílabas faltantes.
  make(7,1,'Palmas para pan','Di PAN y da una palmada por cada sílaba.','¿Cuántas sílabas tiene PAN?',['1','2','3'],'1','¡Muy bien! PAN tiene una sílaba.','Di PAN de una sola vez: una palmada.',{type:'count-syllables',visualHint:'🍞'}),
  make(7,2,'Palmas para casa','Di CA-SA y da una palmada por cada sílaba.','¿Cuántas sílabas tiene CASA?',['1','2','3'],'2','¡Eso es! CA-SA tiene dos sílabas.','Escucha: CA (una), SA (dos).',{type:'count-syllables',visualHint:'🏠'}),
  make(7,3,'Palmas para pelota','Di PE-LO-TA y cuenta tus palmadas.','¿Cuántas sílabas tiene PELOTA?',['2','3','4'],'3','¡Perfecto! PE-LO-TA tiene tres sílabas.','Escucha: PE (una), LO (dos), TA (tres).',{type:'count-syllables',visualHint:'⚽'}),
  make(7,4,'Completa mariposa','Escucha las sílabas: MA, RI, PO, SA. Encuentra la que falta.','MA – RI – ___ – SA',['LO','PO','TA'],'PO','¡Bravo! MA-RI-PO-SA.','Escucha: ma-ri-po-sa. Falta PO.',{type:'complete-word',visualHint:'🦋'}),
  make(7,5,'Completa camino','Escucha: CA, MI, NO. Busca la sílaba del medio.','CA – ___ – NO',['MI','MA','LU'],'MI','¡Excelente! CA-MI-NO.','Escucha: ca-mi-no. Busca MI.',{type:'complete-word',visualHint:'🛤️'}),
  // Mundo 8: formar oraciones con palabras completas, no con sílabas.
  make(8,1,'Luna brillante','Pon las palabras en orden para contar algo sobre la luna.','Forma: La luna brilla.',['brilla','luna','La'],['La','luna','brilla'],'¡Muy bien! La luna brilla.','La oración empieza con La; después luna y brilla.',{type:'order-words',visualHint:'🌙'}),
  make(8,2,'Un cuento de Lito','Ordena las palabras para contar lo que hace Lito.','Forma: Lito lee un cuento.',['cuento','lee','Lito','un'],['Lito','lee','un','cuento'],'¡Excelente! Lito lee un cuento.','Empieza por Lito y continúa con lee, un, cuento.',{type:'order-words',visualHint:'🦜📖'}),
  make(8,3,'El sapo saltarín','Construye una oración sobre el sapo.','Forma: El sapo salta.',['salta','El','sapo'],['El','sapo','salta'],'¡Genial! El sapo salta.','Primero El, después sapo, al final salta.',{type:'order-words',visualHint:'🐸'}),
  make(8,4,'Gatito dormilón','Ordena las palabras para formar una oración.','Forma: Mi gato duerme.',['duerme','gato','Mi'],['Mi','gato','duerme'],'¡Bravo! Mi gato duerme.','Escucha: Mi gato duerme.',{type:'order-words',visualHint:'🐈'}),
  make(8,5,'Una niña canta','Pon las palabras en orden y lee tu oración.','Forma: La niña canta.',['canta','La','niña'],['La','niña','canta'],'¡Logrado! La niña canta.','Empieza con La, sigue niña y termina canta.',{type:'order-words',visualHint:'🎵'})
];
module.exports = exercises;
