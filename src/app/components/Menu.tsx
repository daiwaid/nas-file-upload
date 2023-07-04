'use client'

import { useState } from "react";
import Upload from "./Upload";

export default function Menu() {
  const [currPage, setCurrPage] = useState(0)

  switch (currPage) {
    case 0: return (
      <Upload />
    )
    case 1:
  }
}