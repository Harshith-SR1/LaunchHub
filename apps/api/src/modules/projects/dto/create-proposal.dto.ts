import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateProposalDto {
  @IsString()
  coverLetter: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsNumber()
  @Min(1)
  estimatedDays: number;
}
