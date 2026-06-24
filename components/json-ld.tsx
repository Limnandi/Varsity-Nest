type JsonLdProps = {
  data: Record<string, unknown> | Array<Record<string, unknown>>
}

export default function JsonLd({ data }: JsonLdProps) {
  const graphs = Array.isArray(data) ? data : [data]

  return (
    <>
      {graphs.map((graph, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
        />
      ))}
    </>
  )
}
