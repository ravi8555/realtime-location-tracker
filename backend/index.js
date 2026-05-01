import http from 'node:http';
import express from 'express' 
import {Server} from 'socket.io'
import path from 'node:path';
import { kafkaClient } from './kafka-client.js';

async function main() {
    const PORT = process.env.PORT ?? 8000
    const app = express()
    const server = http.createServer(app)
    const io = new Server()

    const kafkaProducer = kafkaClient.producer()
    await kafkaProducer.connect()

    const kafkaConsumer = kafkaClient.consumer({
        groupId: `socket-server${PORT}`
    })
    await kafkaConsumer.connect()
    await kafkaConsumer.subscribe({
        topics : ['location-update'],
        fromBeginning : true
    })

    kafkaConsumer.run({
        eachMessage : async ({topic, partition, message, heartbeat}) =>{
            const data = JSON.parse(message.value.toString());
            console.log(`KafkaConsumer Data received`, {data});
            io.emit('server:location:update', {id: data.id, latitude:data.latitude, longitude:data.longitude})
            await heartbeat();
        }
        
    })



    io.attach(server)

    io.on('connection', async (socket) =>{
        console.log(`Socket ${socket.id} connected successfuly ... `)

        socket.on('client:location:update', async (locationData) =>{
            const {latitude, longitude} = locationData;
            console.log(`Socket ${socket.id} client:location:update `, locationData);

           await kafkaProducer.send({
            topic: 'location-update', 
            messages : [
                {
                    key :socket.id,
                    value: JSON.stringify({id: socket.id, latitude, longitude}),
                },
        ],
        })

        })

    })

    server.listen(PORT, (req, res)=>{
        console.log(`Server is running at PORT http://localhost:${PORT}`);
        
    })

    app.get('/health', (req,res)=>{
        return res.json({
            message: 'OK',
            success : true
        })
    })

    app.use(express.static(path.resolve('./frontend/public')))


    
}
main()