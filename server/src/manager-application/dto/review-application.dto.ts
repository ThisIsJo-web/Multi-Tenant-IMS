export class ReviewApplicationDto {
  status!: 'approved' | 'rejected';
  reviewerNotes?: string;
}
