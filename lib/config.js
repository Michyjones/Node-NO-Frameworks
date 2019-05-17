

var environments = {}

environments.staging = {
    'httpPort' : 3000,
    'httpsPort' : 3001,
    'envName': 'staging',
    'hashSecret': 'ThisIsAVirus',
    'maxCheckLimit': 5
}

environments.production = {
    'httpPort' : 5000,
    'httpsPort' : 5001,
    'envName': 'production',
    'hashSecret': 'ThisIsAVirusToo',
    'maxCheckLimit': 5
}

var currentEnv = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase(): '';

var envToExport = typeof(environments[currentEnv]) == 'object' ? environments[currentEnv] : environments.staging;


module.exports = envToExport;