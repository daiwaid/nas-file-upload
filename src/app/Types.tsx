export type image = {
  id: number,
  name: string,
  size: number,
  width: number,
  height: number,
  date_created: string,
  path: string,
  thumb: string,
  table?: string
}

export type table = {
  id: number,
  name: string,
  year: number,
  month: number
}

export type imageList = {
  prev: image|undefined,
  curr: image|undefined,
  next: image|undefined
}