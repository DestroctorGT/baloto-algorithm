import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import puppeteer from 'puppeteer'
import { LastBalotoResults } from './entities/last-results.entity'
import { Repository } from 'typeorm'
import { MiLotoResults } from './entities/miloto.entity'
import { subDays, getYear } from 'date-fns'
import { type FindAllMilotoResultsDto } from './dtos/find-all-miloto-results.dto'
import * as ss from 'simple-statistics'

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
    // Contadores para cada número del 1 al 43
    const numberFrequency = Array.from({ length: 43 }, () => 0)

    // Contador para la super balota del 1 al 16
    const superBalotaFrequency = Array.from({ length: 16 }, () => 0)

    // Historial de resultados baloto (No incluye revancha)
    const balotoResults = await this.findAllBalotoResults()

    // Analizar el historial para contar la frecuencia de cada número y la super balota
    balotoResults.forEach(result => {
      result.balotoResult.forEach((numero, index) => {
        if (index < 5) {
          numberFrequency[numero - 1]++
        } else {
          superBalotaFrequency[numero - 1]++
        }
      })
    })

    // Encontrar los 5 números más frecuentes
    const mostFrequentNumbers: number[] = []

    for (let i = 0; i < 5; i++) {
      const maxIndex = numberFrequency.indexOf(Math.max(...numberFrequency))
      mostFrequentNumbers.push(maxIndex + 1)
      numberFrequency[maxIndex] = -1 // Marcar el número como procesado
    }

    // Encontrar la super balota más frecuente
    const mostFrequentSuperBalota = superBalotaFrequency.indexOf(Math.max(...superBalotaFrequency)) + 1

    const mostFrequentNumbersSorted = mostFrequentNumbers.slice().sort((a, b) => a - b)

    // Devolver los números y la super balota más frecuentes
    return { possibleNumber: mostFrequentNumbersSorted, superBalota: mostFrequentSuperBalota }
  }

  async generatePossibleMilotoNumbers (): Promise<number[]> {
    const todayDate: Date = new Date()

    // Contadores para cada número del 1 al 39
    const numberFrequency: number[] = Array.from({ length: 39 }, () => 0)

    // Historial de resultados de la lotería
    const miLotoResults = await this.findAllMilotoResults({ date: todayDate })

    // Analizar el historial para contar la frecuencia de cada número
    miLotoResults.forEach((result: MiLotoResults) => {
      result.miLotoResult.forEach((numero: number) => {
        numberFrequency[numero - 1]++
      })
    })

    // Preparar los datos para la regresión lineal
    const X: number[] = [] // Números de lotería
    const y: number[] = [] // Frecuencias

    // Construir los datos para la regresión
    for (let i = 0; i < numberFrequency.length; i++) {
      X.push(i + 1) // Números de lotería
      y.push(numberFrequency[i]) // Frecuencias
    }

    // Realizar la regresión lineal
    const regression = ss.linearRegression(X.map((num, index) => [num, y[index]]))

    // Obtener las pendientes de la regresión
    const slope: number = regression.m

    // Calcular las predicciones para cada número
    const predictedFrequencies: number[] = y.map(num => num * slope)

    // Encontrar los 5 números menos frecuentes basados en las predicciones
    const leastFrequentNumbers: number[] = []

    for (let i = 0; i < 5; i++) {
      const minIndex: number = predictedFrequencies.indexOf(Math.min(...predictedFrequencies))
      leastFrequentNumbers.push(minIndex + 1)
      predictedFrequencies[minIndex] = Infinity // Marcar el número como procesado
    }

    return leastFrequentNumbers.sort((a, b) => a - b)
  }
}
