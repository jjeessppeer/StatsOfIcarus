class Semaphore {
    constructor(maxSimultaneous, maxAwaiting=100){
        this.resolveQueue = [];
        this.promiseQueue = [];
        this.maxSimultaneous = maxSimultaneous;
        this.maxAwaiting = maxAwaiting
    }

    acquire() {
        if (this.promiseQueue.length > this.maxAwaiting)
            throw new Error("Maximum simultaneous waiting on semaphore.")
        let promise = new Promise(resolve => {
            this.resolveQueue.push(resolve);
        });
        this.promiseQueue.push(promise);

        // Return the promise on which resolve the lock can be aquired.
        return this.promiseQueue[this.promiseQueue.length - 1 - this.maxSimultaneous];
    }
    release() {
        // Resolve the oldest promise
        this.promiseQueue.shift()
        this.resolveQueue.shift()();
    }
}

class Lock extends Semaphore{
    constructor(){
        super(1);
    }
}

module.exports = {
    Lock,
    Semaphore
}