const credential = {

    user:'xspsykzz',
    password:'CUDoix8NqEYpooIxxYa7dTaieBcRjPz9',
    cluster:"puffin.rmq2.cloudamqp.com"

}

const config = {

    rabbitMQ:{

        url:`amqps://${credential.user}:${credential.password}@${credential.cluster}/${credential.user}`,
        exchangeName:"CHAT_SERVICE_EXCHANGE"
    }
}

module.exports = {config}