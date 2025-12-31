const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Question = require('./models/Question');

dotenv.config();

const questions = [
    "Inkább egy nagy lelki élményt kapnál évente egyszer, vagy sok apró, alig észrevehető megerősítést naponta?",
    "Inkább értenéd az összes bibliai tanítást, vagy csak egyet, de azt tökéletesen megélnéd?",
    "Inkább Isten azonnal kijavítaná a hibáidat, vagy hagyná, hogy magad tanulj belőlük?",
    "Inkább minden bűnöd azonnal kiderülne, vagy senki nem tudna róluk, csak Isten?",
    "Inkább elveszítenél valamit, ami fontos neked, vagy megkapnál valamit, ami eltávolít Istentől?",
    "Inkább konfliktust vállalnál az igazságért, vagy békét a hallgatással?",
    "Inkább Isten lassan formálna, vagy gyorsan, fájdalmasan?",
    "Inkább sikeres lennél a világ szemében, vagy hűséges Isten szemében?",
    "Inkább mindig biztos úton járnál, vagy ismeretlen úton, de hittel?",
    "Inkább mondanál ki nehéz igazságot, vagy hallgatnál, hogy ne bánts meg senkit?",
    "Inkább megmutatnád a gyengeségeidet a közösségben, vagy csak az erősségeidet?",
    "Inkább lenne egy ember, aki igazán ismer, vagy sok, aki felnéz rád?",
    "Inkább Isten most kérne tőled valami nehezet, vagy később, amikor „készebbnek” érzed magad?",
    "Inkább lemondanál egy álmodról Istenért, vagy küzdenél érte akkor is, ha bizonytalan?",
    "Inkább imádkoznál, vagy cselekednél azonnal?",
    "Inkább csendben hallgatnád Istent, vagy kérdeznél tőle sokat?"
];

// Helper to split "Inkább A, vagy B?"
const splitQuestion = (text) => {
    // It's not perfect regex, but most fit the pattern "Inkább A, vagy B?"
    // We can just store the full text and let display handle it, or try to split.
    // The questions are well formatted.
    // Let's rely on "vagy" as the separator if "Inkább" is at start.

    // Actually, for simplicity and robustness, I'll store the full text.
    // The frontend can split by ", vagy " for better styling if needed.
    return { text };
};

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        await Question.deleteMany({});
        console.log('Cleared existing questions');

        const questionDocs = questions.map(q => splitQuestion(q));
        await Question.insertMany(questionDocs);
        console.log('Seeded questions');

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();
