var size = 1000;
const matrix = [];
const vector = [];

for (let i = 0; i < size; i++) {
  matrix.push([]);
  for (let j = 0; j < size; j++) {
    matrix[i].push(getRandomInt(0,100));
  }
}

for (let i = 0; i < size; i++) {
  vector.push([getRandomInt(0,100)]);
}

console.log('Matrix:');
console.log(matrix);
console.log('Vector:');
console.log(vector);

const result = [];
const start = Date.now();
for (let i = 0; i < size; i++) {
  let value = 0;
  for (let j = 0; j < size; j++) {
    value += matrix[i][j] * vector[j][0];
  }

  result.push([value]);

  for (const currentTime  = new Date().getTime() + 5; new Date().getTime() < currentTime;);  //looping to simulate some work
}

const end = Date.now();
console.log('Result:');
console.log(result);
console.log('Runtime: ' + (end - start) + 'ms');

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
