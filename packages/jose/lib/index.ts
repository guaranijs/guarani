import { none } from './jws/algorithms/none'

const algorithm = none()

const message = Buffer.from('Super secret message.')
const signature = algorithm.sign(message)

console.log(algorithm.verify(signature, message))
