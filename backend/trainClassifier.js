// Import required modules
const natural = require('natural');

// Load dataset from JSON file
const dataset = require('./dataset.json');
//console.log("Loaded dataset:", dataset);

// Define preprocessing function
function preprocessText(text) {
    try {
        // Initialize text to an empty string if it's not defined
        text = text || '';

        // Convert text to lowercase
        text = text.toLowerCase();

        // Remove punctuation
        text = text.replace(/[^\w\s]/g, '');

        // Tokenize text
        const tokenizer = new natural.WordTokenizer();
        const tokens = tokenizer.tokenize(text);

        // Remove stop words
        const stopwords = new Set(natural.stopwords);
        const filteredTokens = tokens.filter(token => !stopwords.has(token));

        // Perform stemming
        const stemmer = natural.PorterStemmer;
        const stemmedTokens = filteredTokens.map(token => stemmer.stem(token));

        // Join tokens back into a single string
        const processedText = stemmedTokens.join(' ');

        return processedText;
    } catch (error) {
        console.error('Error in preprocessText function:', error);
        return ''; // Return empty string or handle the error as needed
    }
}


// Define Patterns and Responses for Pattern Matching Algorithm - for training the classifier with new patterns and corresponding intents
const patternsAndResponses = {
    "hi|hello|hey": "Greetings",
    "help|need assistance|support": "Support",
    "check order status|where is my order|delivery update": "Order Status",
    "product details|features of [product]|pricing": "Product Information",
    "technical issue|tech support|troubleshooting": "Technical Support",
    "speak to a human|transfer to agent|need to talk to someone": "Transfer to Human Agent",
    "thank you|thanks a lot|appreciate it": "Appreciation",
    "bye|goodbye|see you later": "Goodbye"
};

// Iterate over patternsAndResponses object and add patterns to the dataset
for (const pattern in patternsAndResponses) {
    // Preprocess the pattern
    const preprocessedPattern = preprocessText(pattern);
    // Get the corresponding intent
    const intent = patternsAndResponses[pattern];
    // Find the intent in the dataset
    const existingIntent = dataset.intents.find(item => item.intent === intent);
    // Add the preprocessed pattern as an example for the intent
    if (existingIntent) {
        existingIntent.examples.push(preprocessedPattern);
    } else {
        // If the intent doesn't exist in the dataset, create a new one
        dataset.intents.push({ intent, examples: [preprocessedPattern] });
    }
}

// Train the Naive Bayes classifier
const classifier = new natural.BayesClassifier();

// Iterate over the dataset and add examples to the classifier
dataset.intents.forEach(intent => {
    intent.examples.forEach(example => {
        classifier.addDocument(example, intent.intent);
    });
});

// Shuffle the dataset
const shuffledDataset = dataset.intents.sort(() => Math.random() - 0.5);

// Define the split ratio (e.g., 80% for training, 20% for testing)
const splitRatio = 0.8;
const splitIndex = Math.floor(shuffledDataset.length * splitRatio);

// Split the dataset into training and testing sets
const trainingSet = shuffledDataset.slice(0, splitIndex);
const testingSet = shuffledDataset.slice(splitIndex);

// Print shuffled dataset
//console.log("Shuffled Dataset:", shuffledDataset);

// Print training and testing set sizes
//console.log("Training set size:", trainingSet.length);
//console.log("Testing set size:", testingSet.length);

// Print examples in training set
trainingSet.forEach(intent => {
    //console.log("Intent:", intent.intent);
    //console.log("Examples:", intent.examples);
});

// Train the classifier after processing examples
// console.log('Training classifier...');
classifier.train((progress, message) => {
    console.log('Training progress:', Math.round(progress * 100) + '%', message);
});

// Save the trained classifier to a file
const classifierFile = './classifier.json';
classifier.save(classifierFile, (err) => {
    if (err) {
        console.error('Error saving classifier:', err);
    } else {
        console.log('Classifier saved to', classifierFile);
    }
});

// Export the preprocessText function and the trained classifier
console.log('Exporting preprocessText function and trained classifier from trainClassifier.js');
module.exports = {
    preprocessText,
    classifier
};
