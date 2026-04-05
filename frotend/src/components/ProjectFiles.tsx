type ProjectFilesProps = {
  files: string[]
}

export function ProjectFiles({ files }: ProjectFilesProps) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Project Structure</h2>
      </div>
      <ul className="file-list">
        {files.map((file) => (
          <li key={file}>{file}</li>
        ))}
      </ul>
    </section>
  )
}
