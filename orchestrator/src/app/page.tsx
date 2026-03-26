import Link from "next/link"

export default function Home(){
  return(
    <div className="p-10 space-y-4">
      <h1 className="text-4xl font-bold">
        COSMEON FS-LITE
      </h1>
      <div className="space-x-6">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/nodes">Nodes</Link>
        <Link href="/files">Files</Link>
      </div>
    </div>
  )
}