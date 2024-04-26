import { Entity, CreateDateColumn, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('last_results')
export class LastBalotoResults {
  @PrimaryGeneratedColumn('uuid')
    id: string

  @Column('int', { array: true })
    balotoResult: number[]

  @Column('int', { array: true })
    balotoRematch: number[]

  @CreateDateColumn({ type: 'date', nullable: true })
    dateResult?: Date

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
