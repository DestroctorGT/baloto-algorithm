import { ApiProperty } from '@nestjs/swagger'
import { IsDateString } from 'class-validator'

export class FindAllMilotoResultsDto {
  @ApiProperty({
    description: 'Fecha',
    example: '2024-05-07',
    required: true
  })
  @IsDateString()
    date: Date
}
