# COSMEON - Distributed File System

COSMEON-FS is an educational distributed file system, with some improvements to the traditional working: 
- Cache Based Architecture,
- Adaptive Replication, and
- merkle verifiable repair.
It is also a simulator that demonstrates how systems like S3 store data internally.  
Files are split into chunks, distributed across multiple storage nodes, and reconstructed on request.  
The system includes a Next.js orchestrator, simulated storage nodes, and real-time cluster observability.  
It runs locally using Docker to emulate a distributed storage cluster.

## About the System

- It can toggle between a cache based or a traditional architecture.
- It can handle multiple cache policies such as lru, lruk, lfu, and fifo.
- Files are divided into chunks and stored across the system with multiple copies.
- While downloading, the file is reconstructed from its chunks and then verified using the merkle hash.
- It can run tests by simulating multiple operations (upload, download, delete) onto itself and record metrics.
  * upload `n` files
  * download `n` files in a random order twice (hence, `2n` total downloads)
  * wait for 10 seconds to let some cooldown
  * delete all the `n` files and cleanup
- The file system is GUI based whereas the testing is completely hardcoded as of now.
- System is meant for educational and research purposes.

---

## Setup

### 1. Clone the repository
```
git clone https://github.com/Sarvesh579/cosmeon.git
cd cosmeon
```
this is your root directory
---

### 2. Install dependencies

Install Node.js (v18+)

Install Bun  
https://bun.sh

Install Docker Desktop  
https://www.docker.com/products/docker-desktop/

---

### 3. Install orchestrator dependencies
```
cd orchestrator  
npm install
```
---

### 4. Create mongodb docker
start up the `Docker Desktop` and then in the same dir i.e. `orchestrator/`
```
docker run -d -p 27017:27017 --name cosmeon-mongo mongo
```
---

## Then Everytime do only the following steps
### 4. Start storage cluster
in a new terminal after ensuring `Docker Desktop` is active
```
cd docker  
docker compose up -d
```
---

### 5. Start Mongoose
in same terminal at `docker/`
```
docker start cosmeon-mongo
```
---

### 6. Start orchestrator
in a new terminal
```
cd orchestrator  
npm run dev
```
---

The cluster nodes will run on:

ORBIT-1 → http://localhost:4001  
ORBIT-2 → http://localhost:4002  
ORBIT-3 → http://localhost:4003  
ORBIT-4 → http://localhost:4004  
ORBIT-5 → http://localhost:4005
so on

### 7. To run tests
in the `orchestrator\` directory, we have a file named `.env.local`
This file has two global variables:
- **Architecture** : determines whether the system will run as cached or not
- **Cache Policy** : determines the caching policy which is used to fetch chunks into caches
These can be changed according to the options specified therein.
Tests can be run with various combinations of these variables.

in new terminal, go to `orchestrator\scripts\` directory
```bash
cd orchestrator\scripts
npx tsx benchmark.ts 
npx tsx exportMetrics.ts
```
This generates a CSV in the scripts folder itself of all logs while the tests were running

### 8. To stop all dockers
in the terminal of `docker/`
```bash
docker stop cosemeon-mongo
docker compose down 
```

Some docker related commands to remember:
```bash
npm run dev -- -H cosmeon-fs.co.in

docker compose down -v

docker exec -it cosmeon-mongo mongosh

use cosmeon

db.nodes.deleteMany({})
db.files.deleteMany({})
```
