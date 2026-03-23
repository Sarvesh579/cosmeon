import File from "@/models/File"

export async function computeFaultScore(){
  const files = await File.find()
  let total = 0
  let safe = 0

  for(const file of files){
    for(const chunk of file.chunks){
      total++

      if(chunk.nodes.length >= 2){
        safe++
      }
    }
  }
  return Math.round((safe/total)*100)
}