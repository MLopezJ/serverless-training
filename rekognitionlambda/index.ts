export const handler = async (event: { [x: string]: any; }, context: any) => {

    console.log("Lambda processing event: ", event)

    return 'work in progress'
    
}