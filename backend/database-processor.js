import { kafkaClient } from "./kafka-client.js";

async function init() {
    const kafkaConsumer = kafkaClient.consumer({
        groupId: `database-processorr`
    })
    await kafkaConsumer.connect()
    await kafkaConsumer.subscribe({
        topics : ['location-update'],
        fromBeginning : true
    })

    kafkaConsumer.run({
        eachMessage : async ({topic, partition, message, heartbeat}) =>{
            const data = JSON.parse(message.value.toString());
            console.log(`Insert into db location`, data);
            await heartbeat();
        }
        
    })
    

}
init()