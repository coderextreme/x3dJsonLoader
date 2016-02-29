const spawn = require('child_process').spawn;

const modulus = spawn('modulus', ['deploy'], { stdio: 'inherit'} );

modulus.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
