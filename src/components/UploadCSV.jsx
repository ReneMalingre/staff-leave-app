import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import './UploadCSV.css'

const UploadCSV = () => {
  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0]

    const formData = new FormData()
    formData.append('csv', file)

    axios
      .post('http://localhost:3001/api/upload', formData)
      .then(response => {
        console.log('File uploaded successfully', response.data)
      })
      .catch(error => {
        console.error('Error uploading file', error)
      })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: '.csv',
  })

  return (
    <div {...getRootProps()} className="dropzone">
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the files here ...</p>
      ) : (
        <p>Drag 'n' drop a CSV file here, or click to select a file</p>
      )}
    </div>
  )
}

export default UploadCSV
