import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import puppeteer from 'puppeteer'
import { LastBalotoResults } from './entities/last-results.entity'
import { Repository } from 'typeorm'
import { MiLotoResults } from './entities/miloto.entity'
import { subDays, getYear } from 'date-fns'
import { type FindAllMilotoResultsDto } from './dtos/find-all-miloto-results.dto'

@Injectable()
export class BalotoService {
  constructor (@InjectRepository(LastBalotoResults)
  private readonly lastBalotoResultsRepository: Repository<LastBalotoResults>, @InjectRepository(MiLotoResults) private readonly miLotoResultsRepository: Repository<MiLotoResults>) {}

  @Cron('0 10 * * 4,0', {
    name: 'save-last-results-baloto',
    timeZone: 'America/Bogota'
  })
  async saveLastBalotoResult (): Promise<LastBalotoResults | undefined> {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    })
    const page = await browser.newPage()

    try {
      const todayDate = new Date()
      const yesterdayDate = subDays(todayDate, 1)

      const balotoWebSite = process.env.BALOTO_LAST_RESULTS ?? 'https://baloto.com/resultados'
      // Navegar a la página
      await page.goto(balotoWebSite, { waitUntil: 'networkidle2', timeout: 0 })

      // Obtener los números dentro de los divs con las clases "yellow-ball" y "red-ball"
      const lastBalotoResults: string[] = await page.evaluate(() => {
        const lastBalotoResultDivs = document.querySelectorAll('.yellow-ball, .red-ball')
        const numbersArray: string[] = []

        lastBalotoResultDivs.forEach(div => {
          numbersArray.push(div.textContent?.trim() ?? '')
        })

        return numbersArray
      })

      await browser.close()

      const lastBalotoStrings = lastBalotoResults.slice(0, 6)
      const lastBalotoRematchStrings = lastBalotoResults.slice(6)

      const lastBalotoArrayInt = lastBalotoStrings.map(number => parseInt(number, 10))
      const lastBalotoRematchArrayInt = lastBalotoRematchStrings.map(number => parseInt(number, 10))

      const lastBaloto = await this.lastBalotoResultsRepository.save({
        balotoResult: lastBalotoArrayInt,
        balotoRematch: lastBalotoRematchArrayInt,
        dateResult: yesterdayDate
      })

      return lastBaloto
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message)
      }
    }
  }

  @Cron('0 10 * * 2,3,5,6', {
    name: 'save-last-results-miloto',
    timeZone: 'America/Bogota'
  })
  async saveLastMiLotoResult (): Promise<MiLotoResults | undefined> {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    })
    const page = await browser.newPage()

    try {
      const todayDate = new Date()
      const yesterdayDate = subDays(todayDate, 1)

      const miLotoWebSite = process.env.MILOTO_LAST_RESULTS ?? 'https://baloto.com/miloto/resultados'

      // Navegar a la página
      await page.goto(miLotoWebSite, { waitUntil: 'networkidle2', timeout: 0 })

      // Obtener los números dentro de los divs con las clases "yellow-ball"
      const lastMiLotoResults: string[] = await page.evaluate(() => {
        const lastMiLotoResultDivs = document.querySelectorAll('.yellow-ball')
        const numbersArray: string[] = []

        lastMiLotoResultDivs.forEach(div => {
          numbersArray.push(div.textContent?.trim() ?? '')
        })

        return numbersArray
      })

      await browser.close()

      const lastMiLotoArrayInt = lastMiLotoResults.map(number => parseInt(number, 10))

      const lastMiloto = await this.miLotoResultsRepository.save({
        miLotoResult: lastMiLotoArrayInt,
        date: yesterdayDate
      })

      return lastMiloto
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message)
      }
    }
  }

  async findAllBalotoResults (): Promise<LastBalotoResults[]> {
    return await this.lastBalotoResultsRepository.find({ select: ['balotoResult'] })
  }

  async findAllBalotoRematchResults (): Promise<LastBalotoResults[]> {
    return await this.lastBalotoResultsRepository.find({ select: ['balotoRematch'] })
  }

  async findAllMilotoResults (query: FindAllMilotoResultsDto): Promise<MiLotoResults[]> {
    const { date } = query

    const year = getYear(date).toString()

    const allMilotoResults = await this.miLotoResultsRepository.createQueryBuilder('miloto_results').select('miloto_results.miLotoResult').where('EXTRACT(YEAR FROM miloto_results.date) = :year', { year }).getMany()

    return allMilotoResults
  }

  async generatePossibleBalotoNumber (): Promise<{
    possibleNumber: number[]
    superBalota: number
  }> {
    // Inicializar un objeto para almacenar las frecuencias de los números de baloto junto con el número real
    const numberFrequenciesBaloto: Array<{ number: number, frequency: number }> = []

    // Inicializar un objeto para almacenar las frecuencias de los números super balota junto con el número real
    const numberFrequenciesSuperBalota: Array<{ number: number, frequency: number }> = []

    // Historial de resultados baloto (No incluye revancha)
    const balotoResults = await this.findAllBalotoResults()

    // Analizar el historial para contar la frecuencia de cada número y la super balota
    balotoResults.forEach(result => {
      result.balotoResult.forEach((numero, index) => {
        if (index < 5) {
          const numberExistsInArray = numberFrequenciesBaloto.findIndex((obj) => obj.number === numero)

          if (numberExistsInArray >= 0) {
            numberFrequenciesBaloto[numberExistsInArray].frequency++
          } else {
            numberFrequenciesBaloto.push({ number: numero, frequency: 1 })
          }
        } else {
          const numberExistsInArray = numberFrequenciesSuperBalota.findIndex((obj) => obj.number === numero)

          if (numberExistsInArray >= 0) {
            numberFrequenciesSuperBalota[numberExistsInArray].frequency++
          } else {
            numberFrequenciesSuperBalota.push({ number: numero, frequency: 1 })
          }
        }
      })
    })

    const possibleNumbersBaloto: number[] = []

    const possibleNumbersSuperBalota: number[] = []

    numberFrequenciesBaloto.forEach((obj) => {
      if (obj.frequency >= 1) possibleNumbersBaloto.push(obj.number)
    })

    numberFrequenciesSuperBalota.forEach((obj) => {
      if (obj.frequency >= 1) possibleNumbersSuperBalota.push(obj.number)
    })

    // Crear una copia del array original para no modificar el original
    const possibleNumbersBalotoCopy = [...possibleNumbersBaloto]

    // Array para almacenar los números seleccionados
    const newNumbers: number[] = []

    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * possibleNumbersBalotoCopy.length)

      newNumbers.push(possibleNumbersBalotoCopy[randomIndex])

      // Eliminar el número seleccionado del array copia para evitar repeticiones
      possibleNumbersBalotoCopy.splice(randomIndex, 1)
    }

    // Encontrar la super balota más frecuente
    const mostFrequentSuperBalotaIndex = Math.floor(Math.random() * possibleNumbersSuperBalota.length)

    const mostFrequentSuperBalota = possibleNumbersSuperBalota[mostFrequentSuperBalotaIndex]

    const mostFrequentNumbersSorted = newNumbers.slice().sort((a, b) => a - b)

    // Devolver los números y la super balota más frecuentes
    return { possibleNumber: mostFrequentNumbersSorted, superBalota: mostFrequentSuperBalota }
  }

  async generatePossibleMilotoNumbers (): Promise<number[]> {
    const todayDate: Date = new Date()

    // Historial de resultados de la lotería
    const miLotoResults = await this.findAllMilotoResults({ date: todayDate })

    // Inicializar un objeto para almacenar las frecuencias de los números junto con el número real
    const numberFrequencies: Array<{ number: number, frequency: number }> = []

    // Analizar el historial para contar la frecuencia de cada número
    miLotoResults.forEach((result) => {
      result.miLotoResult.forEach((numero) => {
        const numberExistsInArray = numberFrequencies.findIndex((obj) => obj.number === numero)

        if (numberExistsInArray >= 0) {
          numberFrequencies[numberExistsInArray].frequency++
        } else {
          numberFrequencies.push({ number: numero, frequency: 1 })
        }
      })
    })

    const possibleNumbers: number[] = []

    numberFrequencies.forEach((obj) => {
      if (obj.frequency >= 9) possibleNumbers.push(obj.number)
    })

    // Crear una copia del array original para no modificar el original
    const possibleNumbersCopy = [...possibleNumbers]

    // Array para almacenar los números seleccionados
    const newNumbers: number[] = []

    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * possibleNumbersCopy.length)

      newNumbers.push(possibleNumbersCopy[randomIndex])

      // Eliminar el número seleccionado del array copia para evitar repeticiones
      possibleNumbersCopy.splice(randomIndex, 1)
    }

    return newNumbers.sort((a, b) => a - b)
  }
}
