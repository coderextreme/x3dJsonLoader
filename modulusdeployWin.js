const spawn = require('child_process').spawn;

const modulus = spawn('modulus.cmd', ['deploy'], { stdio: 'inherit'} );

modulus.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
