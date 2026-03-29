import { connectDB } from "@/lib/db"
import Node from "@/models/Node"
import User from "@/models/User"
import NodeMap from "@/components/NodeMapClient"

export default async function Page() {
  await connectDB()
  const nodes = await Node.find().lean()
  const user = await User.findOne().lean()
  const userLocation = user.location
  const l1 = user.cacheLayout?.L1
  const l2 = user.cacheLayout?.L2 || []

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">
        Cluster Visualization
      </h1>

      <NodeMap
        nodes={JSON.parse(JSON.stringify(nodes))}
        userLocation={userLocation}
        l1={l1}
        l2={l2}
      />
    </div>
  )
}