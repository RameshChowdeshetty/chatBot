import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './document.entity';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {}

  async create(title: string, content: string): Promise<Document> {
    const document = this.documentRepository.create({ title, content });
    return this.documentRepository.save(document);
  }

  async findAll(): Promise<Document[]> {
    return this.documentRepository.find();
  }

  async findOne(id: number): Promise<Document> {
    return this.documentRepository.findOne({ where: { id } });
  }

  async update(id: number, data: Partial<Document>): Promise<Document> {
    await this.documentRepository.update(id, data);
    return this.documentRepository.findOne({ where: { id } });
  }

  async delete(id: number): Promise<void> {
    await this.documentRepository.delete(id);
  }
}