import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Request,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDetailDto } from './dto/create-customer-detail.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomersService) {}

  @Get('profile')
  async getCustomerDetails(@Request() req) {
    try {
      return await this.customerService.findOneCustomerDetailById(
        req.user?.customer, // Access nested ID correctly
      );
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.message,
        error.getStatus?.() || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('profile')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'home_image_url', maxCount: 1 },
        { name: 'home_image_gallery', maxCount: 5 },
      ],
      {
        storage: diskStorage({
          destination: join(process.cwd(), 'uploads', 'customer'),
          filename: (req, file, cb) => {
            const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
            cb(null, uniqueName);
          },
        }),
      },
    ),
  )
  async updateCustomerDetail(
    @Body() updateCustomerDetailDto: CreateCustomerDetailDto,
    @Request() req,
    @UploadedFiles()
    uploadedFiles: {
      home_image_url?: Express.Multer.File[];
      home_image_gallery?: Express.Multer.File[];
    },
  ) {
    try {
      const filePaths = {
        home_image_url: uploadedFiles.home_image_url?.[0]
          ? `/uploads/customer/${uploadedFiles.home_image_url[0].filename}`
          : undefined,
        home_image_gallery:
          uploadedFiles.home_image_gallery?.map(
            (f) => `/uploads/customer/${f.filename}`,
          ) ?? undefined,
      };

      return await this.customerService.updateCustomerDetail(
        req.user.customer.id,
        { ...updateCustomerDetailDto, ...filePaths },
      );
    } catch (error) {
      throw new HttpException(
        error.message,
        error.getStatus?.() || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


    // @Post('profile')
  // @UseInterceptors(
  //   FileFieldsInterceptor(
  //     [
  //       { name: 'home_image_url', maxCount: 1 },
  //       { name: 'home_image_gallery', maxCount: 5 },
  //     ],
  //     {
  //       storage: diskStorage({
  //         destination: join(process.cwd(), 'uploads', 'customer'),
  //         filename: (req, file, cb) => {
  //           const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
  //           cb(null, uniqueName);
  //         },
  //       }),
  //     },
  //   ),
  // )
  // async createCustomerDetail(
  //   @Body() createCustomerDetailDto: CreateCustomerDetailDto,
  //   @Request() req,
  //   @UploadedFiles()
  //   uploadedFiles: {
  //     home_image_url?: Express.Multer.File[];
  //     home_image_gallery?: Express.Multer.File[];
  //   },
  // ) {
  //   try {
  //     // Handle file paths
  //     const filePaths = {
  //       home_image_url: uploadedFiles.home_image_url?.[0]
  //         ? `/uploads/customer/${uploadedFiles.home_image_url[0].filename}`
  //         : undefined,
  //       home_image_gallery:
  //         uploadedFiles.home_image_gallery?.map(
  //           (f) => `/uploads/customer/${f.filename}`,
  //         ) ?? undefined, // Return null if the left side is undefined/null
  //     };

  //     console.log('Create profile :', createCustomerDetailDto);
  //     return this.customerService.createCustomerDetail(req.user.customer.id, {
  //       ...createCustomerDetailDto,
  //       ...filePaths,
  //     });
  //   } catch (error) {
  //     throw new HttpException(
  //       error.message,
  //       error.getStatus?.() || HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  
}
