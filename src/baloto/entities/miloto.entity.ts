import { Entity, CreateDateColumn, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('miloto_results')
export class MiLotoResults {
  @PrimaryGeneratedColumn('uuid')
    id: string

  @Column('int', { array: true })
    miLotoResult: number[]

  @CreateDateColumn({ type: 'date' })
    date: Date

  @CreateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'CURRENT_TIMESTAMP'
  })
    createdAt: Date

  @CreateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'CURRENT_TIMESTAMP'
  })
    updatedAt: Date
}
