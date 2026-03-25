import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { RequestStatusService } from './request-status.service';
import { CreateRequestStatusDto } from './dto/create-request-status.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@Controller('request-status')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class RequestStatusController {
  constructor(private readonly requestStatusService: RequestStatusService) {}

  @Post()
  async create(@Body() createRequestStatusDto: CreateRequestStatusDto) {
    const data = await this.requestStatusService.create(createRequestStatusDto);
    return { data, message: 'Request status created successfully' };
  }

  @Get()
  @Roles(Role.Admin, Role.HR, Role.Technician, Role.User)
  async findAll(@Query() query: PaginationQueryDto) {
    const result = await this.requestStatusService.findAll(query);
    return { ...result, message: 'Request statuses retrieved successfully' };
  }

  @Get(':id')
  @Roles(Role.Admin, Role.HR, Role.Technician, Role.User)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.requestStatusService.findOne(id);
    return { data, message: 'Request status retrieved successfully' };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRequestStatusDto: UpdateRequestStatusDto,
  ) {
    const data = await this.requestStatusService.update(
      id,
      updateRequestStatusDto,
    );
    return { data, message: 'Request status updated successfully' };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.requestStatusService.remove(id);
    return { data, message: 'Request status deleted successfully' };
  }
}
