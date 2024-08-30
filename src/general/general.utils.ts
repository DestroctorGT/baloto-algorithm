import { ResponseStatus } from './general.enum'

interface PaginateResponse<Data> {
  count: number
  data: Data[]
  page: number
  take: number
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const paginateResponse = <Data>({ count, data, page, take }: PaginateResponse<Data>) => {
  const lastPage = Math.ceil(count / take)
  const nextPage = page + 1 > lastPage ? null : page + 1
  const prevPage = page - 1 < 1 ? null : page - 1

  return {
    status: ResponseStatus.Ok,
    data: [...data],
    count,
    currentPage: page,
    nextPage,
    prevPage,
    lastPage
  }
}
