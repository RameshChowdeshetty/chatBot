import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Param,
    Body,
    HttpException,
    HttpStatus,
    UseGuards,
  } from '@nestjs/common';
  import { HttpService } from '@nestjs/axios';
  import { DocumentService } from './document.service';
  import { firstValueFrom } from 'rxjs';
  import { Roles } from '../auth/roles.decorator';
  import { Role } from '../auth/role.enum';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { RolesGuard } from '../auth/roles.guard';
  
  @Controller('documents')
  @UseGuards(JwtAuthGuard, RolesGuard) // Apply guards
  export class DocumentController {
    constructor(
      private readonly documentService: DocumentService,
      private readonly httpService: HttpService,
    ) {}
  
    @Post()
    @Roles(Role.Admin, Role.Editor) // Only Admins and Editors can create documents
    async create(@Body() dto: { title: string; content: string }) {
      const document = await this.documentService.create(dto.title, dto.content);
  
      // Trigger ingestion in the Python backend
      try {
        const response = await firstValueFrom(
          this.httpService.post<{ id: number; message: string }>(
            process.env.PYTHON_BACKEND_URL,
            {
              title: dto.title,
              content: dto.content,
            },
          ),
        );
        document.isIngested = true;
        await this.documentService.update(document.id, { isIngested: true });
        return { ...document, pythonResponse: response.data };
      } catch (error) {
        console.error('Ingestion Error:', error.message);
  
        if (error.response && error.response.status) {
          throw new HttpException(
            `Ingestion failed with status ${error.response.status}: ${error.response.statusText}`,
            HttpStatus.BAD_GATEWAY,
          );
        } else {
          throw new HttpException(
            'Ingestion failed: Python backend is unreachable',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      }
    }
  
    @Get()
    @Roles(Role.Admin, Role.Editor, Role.Viewer) // Allow all roles to view documents
    async findAll() {
      return this.documentService.findAll();
    }
  
    @Get(':id')
    @Roles(Role.Admin, Role.Editor, Role.Viewer)
    async findOne(@Param('id') id: number) {
      return this.documentService.findOne(id);
    }
  
    @Patch(':id')
    @Roles(Role.Admin, Role.Editor) // Only Admins and Editors can update documents
    async update(@Param('id') id: number, @Body() data: Partial<Document>) {
      return this.documentService.update(id, data);
    }
  
    @Delete(':id')
    @Roles(Role.Admin) // Only Admins can delete documents
    async delete(@Param('id') id: number) {
      await this.documentService.delete(id);
      return { message: 'Document deleted successfully' };
    }
  }
  