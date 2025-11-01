
const apiGateway: string = "5vob62mih1"

export const environment = {
    imageBase64:  'data:image/jpeg;base64,',
    userPoolId: 'eu-central-1_YJgBxTfaY',
    userPoolWebClientId: '',
    getUploadUrl: `https://${apiGateway}.execute-api.eu-central-1.amazonaws.com/upload-url`,
    getMovie: `https://${apiGateway}.execute-api.eu-central-1.amazonaws.com/get-movie`,
    getPreviewUrl: `https://${apiGateway}.execute-api.eu-central-1.amazonaws.com/preview-url`,
    getDownloadUrl: `https://${apiGateway}.execute-api.eu-central-1.amazonaws.com/download-url`,
    deleteMovie: `https://${apiGateway}.execute-api.eu-central-1.amazonaws.com/delete-movie`,
    getAllMovies: `https://${apiGateway}.execute-api.eu-central-1.amazonaws.com/movies`,
    updateMovie: `https://${apiGateway}.execute-api.eu-central-1.amazonaws.com/put-movie`,
    isLiked: `https://${apiGateway}.execute-api.eu-central-1.amazonaws.com/get-like`,
    postLike: `https://${apiGateway}.execute-api.eu-central-1.amazonaws.com/post-like`,
    deleteLike: `https://${apiGateway}.execute-api.eu-central-1.amazonaws.com/delete-like`,
    getTopics: `https://${apiGateway}.execute-api.eu-central-1.amazonaws.com/get-topics`,
    getSubscription : `https://${apiGateway}.execute-api.eu-central-1.amazonaws.com/get-subscription`,
    postSubscription : `https://${apiGateway}.execute-api.eu-central-1.amazonaws.com/post-subscription`,
    putSubscription : `https://${apiGateway}.execute-api.eu-central-1.amazonaws.com/put-subscription`,
    getFeed : `https://${apiGateway}.execute-api.eu-central-1.amazonaws.com/get-feed`,
}
