class Semaphore {
    constructor(maxSimultaneous){
        this.resolveQueue = [];
        this.promiseQueue = [];
        this.maxSimultaneous = maxSimultaneous;
    }

    acquire() {
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