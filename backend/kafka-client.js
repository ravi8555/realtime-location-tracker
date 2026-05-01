import { Kafka } from "kafkajs";


export const kafkaClient = new Kafka({
    clientId : 'trackerAdmin',
    brokers : ['localhost:9092']
})