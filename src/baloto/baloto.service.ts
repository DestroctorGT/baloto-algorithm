import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import puppeteer from 'puppeteer'
import { LastBalotoResults } from './entities/last-results.entity'
import { Repository } from 'typeorm'

@Injectable()
export class BalotoService {
  constructor (@InjectRepository(LastBalotoResults)
  private readonly lastBalotoResultsRepository: Repository<LastBalotoResults>) {}

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
        balotoRematch: lastBalotoRematchArrayInt
      })

      return lastBaloto
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
}
