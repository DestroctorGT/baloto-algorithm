import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
    id: string

  @Column('varchar')
    name: string

  @Column('varchar')
    lastName: string

  @Column('varchar')
    username: string

  @Column('varchar')
    password: string

  @Column('varchar')
    email: string

  @Column('varchar', { nullable: true })
    resetPasswordTemporalCode: string

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
