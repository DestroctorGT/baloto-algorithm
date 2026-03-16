import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import puppeteer from 'puppeteer'
import { LastBalotoResults } from './entities/last-results.entity'
import { Repository } from 'typeorm'
import { MiLotoResults } from './entities/miloto.entity'
import { subDays } from 'date-fns'

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

  async findAllMilotoResults (): Promise<MiLotoResults[]> {
    const allMilotoResults = await this.miLotoResultsRepository
      .createQueryBuilder('miloto_results')
      .select(['miloto_results.miLotoResult', 'miloto_results.date'])
      .orderBy('miloto_results.date', 'DESC')
      .getMany()

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
    // Historial de resultados de la lotería (ordenados por fecha DESC para recencia)
    const miLotoResults = await this.findAllMilotoResults()

    // Fallback si no hay datos en DB
    if (miLotoResults.length === 0) {
      const all = Array.from({ length: 43 }, (_, i) => i + 1)
      const fallback: number[] = []
      for (let i = 0; i < 5; i++) {
        const idx = Math.floor(Math.random() * all.length)
        fallback.push(all[idx])
        all.splice(idx, 1)
      }
      return fallback.sort((a, b) => a - b)
    }

    // Mejora 4: Sesgo de recencia — últimos 30 sorteos tienen peso 2x
    const RECENT_WINDOW = 30
    const numberFrequencies: Array<{ number: number, frequency: number }> = []

    miLotoResults.forEach((result, index) => {
      const weight = index < RECENT_WINDOW ? 2 : 1
      result.miLotoResult.forEach((numero) => {
        const existing = numberFrequencies.find((o) => o.number === numero)
        if (existing !== undefined) {
          existing.frequency += weight
        } else {
          numberFrequencies.push({ number: numero, frequency: weight })
        }
      })
    })

    // Mejora 1: Umbral de frecuencia dinámico — percentil 60 de las frecuencias
    const sortedFreqs = numberFrequencies.map((o) => o.frequency).sort((a, b) => a - b)
    const p60Index = Math.floor(sortedFreqs.length * 0.6)
    const threshold = sortedFreqs[p60Index]

    let possibleNumbers: number[] = numberFrequencies
      .filter((obj) => obj.frequency >= threshold)
      .map((obj) => obj.number)

    // Garantizar un pool mínimo de 15 números
    if (possibleNumbers.length < 15) {
      const topByFreq = [...numberFrequencies]
        .sort((a, b) => b.frequency - a.frequency)
        .map((o) => o.number)
      for (const n of topByFreq) {
        if (!possibleNumbers.includes(n)) possibleNumbers.push(n)
        if (possibleNumbers.length >= 15) break
      }
    }

    // Mejora 2: Calcular rango de suma estadístico desde los datos históricos reales
    const pastWinningSums = miLotoResults.map((r) =>
      r.miLotoResult.reduce((acc, n) => acc + n, 0)
    )
    const mean = pastWinningSums.reduce((a, b) => a + b, 0) / pastWinningSums.length
    const std = Math.sqrt(
      pastWinningSums.reduce((a, b) => a + (b - mean) ** 2, 0) / pastWinningSums.length
    )
    const minSum = Math.round(mean - std)
    const maxSum = Math.round(mean + std)

    // Mejora 5: Distribución por rangos (bajo: 1-14, medio: 15-28, alto: 29-43)
    const lowRange = possibleNumbers.filter((n) => n <= 14)
    const midRange = possibleNumbers.filter((n) => n >= 15 && n <= 28)
    const highRange = possibleNumbers.filter((n) => n >= 29)

    // Mejora 3: Límite de iteraciones con fallback
    const MAX_ATTEMPTS = 10000
    let attempts = 0
    let newNumbers: number[] = []
    let sum = 0

    do {
      newNumbers = []
      const tempLow = [...lowRange]
      const tempMid = [...midRange]
      const tempHigh = [...highRange]
      const tempAll = [...possibleNumbers]

      const pickFrom = (source: number[]): number | null => {
        if (source.length === 0) return null
        const idx = Math.floor(Math.random() * source.length)
        const num = source[idx]
        source.splice(idx, 1)
        const allIdx = tempAll.indexOf(num)
        if (allIdx >= 0) tempAll.splice(allIdx, 1)
        return num
      }

      // Seleccionar al menos 1 número de cada rango disponible
      const fromLow = pickFrom(tempLow)
      const fromMid = pickFrom(tempMid)
      const fromHigh = pickFrom(tempHigh)
      if (fromLow !== null) newNumbers.push(fromLow)
      if (fromMid !== null) newNumbers.push(fromMid)
      if (fromHigh !== null) newNumbers.push(fromHigh)

      // Completar los 5 números restantes del pool general
      while (newNumbers.length < 5 && tempAll.length > 0) {
        const idx = Math.floor(Math.random() * tempAll.length)
        newNumbers.push(tempAll[idx])
        tempAll.splice(idx, 1)
      }

      sum = newNumbers.reduce((acc, n) => acc + n, 0)
      attempts++
    } while ((sum < minSum || sum > maxSum) && attempts < MAX_ATTEMPTS)

    // Fallback: si no se encontró combinación válida, retornar los 5 más frecuentes
    if (attempts >= MAX_ATTEMPTS) {
      newNumbers = [...numberFrequencies]
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5)
        .map((o) => o.number)
    }

    return newNumbers.sort((a, b) => a - b)
  }
}
