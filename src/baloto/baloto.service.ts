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
}
