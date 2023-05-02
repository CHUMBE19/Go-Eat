<script>
    // @ts-nocheck
    import toast, { Toaster } from 'svelte-french-toast';
    import { onMount } from 'svelte';
    import server from '../server';
    import QRCode from 'qrcode-generator';
    
    let gameOpen=false;
    let car=0;
    let gameActive=false;
    let gameOpencasine=false;
    let products={list:[],pages:[],filters:{}};
    let showRegister = false;
    let phone;
    let email;
    //Dynamsoft.DBR.BarcodeReader.license = "DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ==";
    let scanner = null;
    let product = [];
    let inforQR={organization:"Sazon del Pato",tables:1,code:"CO-0001"};
    let productScanner={list:[],pages:[],filters:{}};
    let totalMoney=0;
    let qr = QRCode(0, 'L');
    qr.addData(JSON.stringify(inforQR));
    qr.make();

    const scannerActive=async()=>{
        try {
            await Dynamsoft.DBR.BarcodeScanner.loadWasm();
            await initBarcodeScanner();
        } catch (ex) {
            alert(ex.message);
            throw ex;
        }
    };

    async function initBarcodeScanner() {
        scanner = await Dynamsoft.DBR.BarcodeScanner.createInstance();
        scanner.onFrameRead = results => {
            console.log(results);
            for (let result of results) {
                resultscanner(result);   
            }
        };
        scanner.onUnduplicatedRead = (txt, result) => {};
        await scanner.show();
    }
    const resultscanner=async (result)=>{
        console.log("result",result.barcodeText);
        let params=result.barcodeText;
        let vulea='{"organization":"Sazon del Pato","tables":1,"code":"CO-0001"}';
        let parsedBody = JSON.parse(vulea);
        products.filters={...parsedBody};
        var data= await server.getproductos(products.filters);
        productScanner.xpagina=data.xpagina;
        productScanner.pagina=data.pagina;
        productScanner.total=data.total;
        productScanner.list=data.list;
        window.$(".bd-model").modal("show");
    };

    function showQRCode() {
        let qrCodeElement = document.getElementById('qrcode');
        qrCodeElement.innerHTML = qr.createImgTag(4);
    }
 
    onMount(async () => {
      await getProducts();
    });

    const getProducts= async ()=>{
      try {
         var data= await server.getproductos(products.filters);
         products.xpagina=data.xpagina;
         products.pagina=data.pagina;
         products.total=data.total;
         products.list=data.list;
      } catch (e) {
        toast('Hello Darkness!', {
            icon: '👏',
            style: 'border-radius: 200px; background: #333; color: #fff;'
        });
      }     
    };

    function addProduct(value) {
        product = [...product, value];
        console.log(product);
        calculatePrice(product);

    }

    function calculatePrice(product){
        totalMoney=0;
        product.forEach(element => {
            totalMoney+= element.totalmoney;
        });
    }; 
        

   const prepareSearch=(e)=>{
      if(e.charCode===13){ 
        getProducts();
      }
    };

    const paymentProceed=()=>{
        toast("GAME: Para ganar premios y ofertas. compite y acomula puntos jugando con nosotros", {
            icon: '👏',
            style: ' background: #333; color: #fff;background-image: url("img/anuncio.avif");width:100%;height:70px; background-repeat: no-repeat, repeat; background-position: center;'
        });
        gameActive=true;
    };

    const onRegister = () => {
        showRegister = true;
    }

    const register = async () => {
        validateInputs();
    }

    const onRegisterCancel = () => {
        showRegister = false;
    }

    const validateInputs = () =>{
        if(!email) return alert("Ingrese un correo válido");
        if(!phone) return alert("Ingrese teléfono válido");
        else {
            alert("registro pendiente");
            onRegisterCancel();
            location.reload();
        }
    }

</script>

    


<main>

    <body><Toaster />
        <div id="qrcode"></div>
        <!-- Topbar Start -->
        <div class="container-fluid">
            <div class="row align-items-center bg-light py-3 px-xl-5 d-none d-lg-flex">
                <div class="col-lg-4">
                    <img src="img/goeat.png" width="80" height="80" style="margin-top: -26px;" >
                    <a  class="text-decoration-none">
                        <span class="h1 text-uppercase text-primary">Go</span>
                        <span class="h1 text-uppercase text-dark">Eat</span>
                    </a>
                </div>
                <div class="col-lg-4 col-6 text-left">
                    <div class="input-group">
                        <input type="text" class="form-control" bind:value={products.filters.name} on:keypress={prepareSearch} placeholder="Search for products">
                        <div class="input-group-append">
                            <span class="input-group-text bg-transparent text-primary">
                                <i class="fa fa-search"></i>
                            </span>
                        </div>
                    </div>
        
                </div>

                <div class="col-lg-4 col-6 text-right">
                    <!--button class="btn-register" data-toggle="modal" data-target="modal-fade-register" on:click={onRegister}>Registro</button-->
                    <a href="#" class="btn register ml-3" data-toggle="modal" data-target="modal-fade-register">
                        <button class="btn-register" data-toggle="modal" data-target="#myModal" on:click={onRegister}>Registro</button>
                    </a>
                </div>

                {#if showRegister}
                <div class="modal fade" id="myModal">
                    <div class="modal-dialog modal-small">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="exampleModalLabel"> <img src="img/goeat.png" width="40" height="40" > Regístrese para más promociones</h5>
                            </div>
                            <div class="modal-body">
                                <input bind:value={email} type="email" placeholder="email">
                                <input bind:value={phone} type="number" placeholder="phone">
                            </div>
                            <div class="modal-footer">
                                <button class="btn-register-cancel" data-dismiss="modal" aria-label="Close" on:click={onRegisterCancel}>cancelar</button>
                                    <button class="btn-register-confirm" on:click={register}>Registrarme</button>
                            </div>
                        </div>
                    </div>
                </div>
                {/if}


            </div>
        </div>
        <!-- Topbar End -->
    
    
        <!-- Navbar Start -->
        <div class="container-fluid bg-dark mb-30">
            <div class="row px-xl-5">
                <div class="col-lg-3 d-none d-lg-block">
                    <a class="btn d-flex align-items-center justify-content-between bg-primary w-100" data-toggle="collapse" href="#navbar-vertical" style="height: 65px; padding: 0 30px;">
                        <h6 class="text-dark m-0"><i class="fa fa-bars mr-2"></i>Categorias</h6>
                        <i class="fa fa-angle-down text-dark"></i>
                    </a>
                    <nav class="collapse position-absolute navbar navbar-vertical navbar-light align-items-start p-0 bg-light" id="navbar-vertical" style="width: calc(100% - 30px); z-index: 999;">
                        <div class="navbar-nav w-100">
                            <div class="nav-item dropdown dropright">
                            <a href="" class="nav-item nav-link">Brosterias</a>
                            <a href="" class="nav-item nav-link">Pizzas</a>
                            <a href="" class="nav-item nav-link">Taquerias</a>
                            <a href="" class="nav-item nav-link">Juguerias</a>
                            <a href="" class="nav-item nav-link">Restobar</a>
                        </div>
                    </nav>
                </div>
                <div class="col-lg-9">
                    <nav class="navbar-perfile navbar navbar-expand-lg bg-dark navbar-dark py-3 py-lg-0 px-0">
                        <button type="button" class="navbar-toggler" data-toggle="collapse" data-target="#navbarCollapse">
                            <span class="navbar-toggler-icon"></span>
                        </button>
                        <a href="" class="text-decoration-none d-block d-lg-none">
                            <span class="h1 text-uppercase text-dark bg-light px-2">GO</span>
                            <span class="h1 text-uppercase text-light bg-primary px-2 ml-n1">Eat</span>
                        </a>
                        <div class="collapse navbar-collapse justify-content-between" id="navbarCollapse">
                            <div class="navbar-nav mr-auto py-0">
                                <a href="index.html" class="nav-item nav-link active">Home</a>
                                <a href="shop.html" class="nav-item nav-link">Shop</a>
                                <a href="detail.html" class="nav-item nav-link">Shop Detail</a>
                                <div class="nav-item dropdown">
                                    <a href="#" class="nav-link dropdown-toggle" data-toggle="dropdown">Pages <i class="fa fa-angle-down mt-1"></i></a>
                                    <div class="dropdown-menu bg-primary rounded-0 border-0 m-0">
                                        <a href="cart.html" class="dropdown-item">Shopping Cart</a>
                                        <a href="checkout.html" class="dropdown-item">Checkout</a>
                                    </div>
                                </div>
                                <a href="contact.html" class="nav-item nav-link">Contact</a>
                            </div>
                            <div class="navbar-nav ml-auto py-0 d-none d-lg-block">
                                <a href="#" class="btn px-0">
                                    <i class="fas fa-heart text-primary"></i>
                                    <span class="badge text-secondary border border-secondary rounded-circle" style="padding-bottom: 2px;">0</span>
                                </a>
                                <a href="#" class="btn px-0 ml-3" data-toggle="modal" data-target=".bd-example-modal-sm">
                                    <i class="fas fa-shopping-cart text-primary"></i>
                                    <span class="badge text-secondary border border-secondary rounded-circle" style="padding-bottom: 2px;">{product.length}</span>
                                </a>
                            </div>
                        </div>
                    </nav>
                </div>
            </div>
        </div>
        <!-- Navbar End -->
    
        <div class="content-page">
                <!-- Carousel Start -->
            <div class="container-fluid">
                <div class="row px-xl-4">
                    <div class="col-lg-12">
                        <div id="header-carousel" class="carousel slide carousel-fade mb-30 mb-lg-0" data-ride="carousel">
                            <ol class="carousel-indicators">
                                <li data-target="#header-carousel" data-slide-to="0" class="active"></li>
                                <li data-target="#header-carousel" data-slide-to="1"></li>
                                <li data-target="#header-carousel" data-slide-to="2"></li>
                            </ol>
                            <div class="carousel-inner">
                                <div class="carousel-item position-relative active" style="height: 220px;">
                                    <img class="position-absolute w-100 h-100" src="img/carousel-1.jpg" style="object-fit: cover;">
                                    <div class="carousel-caption d-flex flex-column align-items-center justify-content-center">
                                        <div class="p-3" style="max-width: 700px;">
                                            <h1 class="display-4 text-white mb-3 animate__animated animate__fadeInDown">Warmin Coffe</h1>
                                            <p class="mx-md-5 px-5 animate__animated animate__bounceIn">Warmi, el lugar adecuado si te encuentras en tingo maría </p>
                                        </div>
                                    </div>
                                </div>
                                <div class="carousel-item position-relative" style="height: 220px;">
                                    <img class="position-absolute w-100 h-100" src="img/carousel-2.jpg" style="object-fit: cover;">
                                    <div class="carousel-caption d-flex flex-column align-items-center justify-content-center">
                                        <div class="p-3" style="max-width: 700px;">
                                            <h1 class="display-4 text-white mb-3 animate__animated animate__fadeInDown">Women Fashion</h1>
                                            <p class="mx-md-5 px-5 animate__animated animate__bounceIn">Lugar adecuado si te encuentras en tingo maría </p>
                                        </div>
                                    </div>
                                </div>
                                <div class="carousel-item position-relative" style="height: 220px;">
                                    <img class="position-absolute w-100 h-100" src="img/carousel-3.jpg" style="object-fit: cover;">
                                    <div class="carousel-caption d-flex flex-column align-items-center justify-content-center">
                                        <div class="p-3" style="max-width: 700px;">
                                            <h1 class="display-4 text-white mb-3 animate__animated animate__fadeInDown">Kids Fashion</h1>
                                            <p class="mx-md-5 px-5 animate__animated animate__bounceIn">Lugar adecuado si te encuentras en tingo maría </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                
                </div>
            </div>
            <!-- Carousel End -->   
            
            <div class="col-lg-4  text-left buscadorMovil">
                <div class="input-group">
                    <input type="text" class="form-control" bind:value={products.filters.name}  placeholder="Search for products">
                    <div class="input-group-append" on:click={getProducts} style="cursor: pointer;">
                        <span class="input-group-text bg-transparent text-primary">
                            <i class="fa fa-search"></i>
                        </span>
                    </div>
                </div>
            </div>

            <div class="container-fluid">
                
                <h2 class="section-title position-relative text-uppercase mx-xl-5 mb-4"><span class="bg-secondary pr-3">COMIDAS</span></h2>
                <div class="row px-xl-5 pb-3">
                    {#each  products.list as value , key}

                        <div class="col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product" on:click={()=>{addProduct(value)}}>
                            <a  href="#"class="text-decoration-none">
                                <div class="cat-item d-flex align-items-center mb-4">
                                    <div class="overflow-hidden" style="width: 120px; height: 120px;">
                                        <img class="img-fluid" src="{value.photo}" alt="" style="height: 119px;">
                                    </div>
                                    <div class="flex-fill pl-3">
                                        <h6>{value.name}</h6>
                                        <small class="text-body">100 Products</small>
                                        <small class="text-price">S/. {value.totalmoney}.00</small>
                                    </div>
                                </div>
                            </a>
                        </div>
                    {/each}

                </div>
            </div>
        </div>
     


        <div class="card back-to-card  bg-dark">
            <a  href="#" class="btn px-0 "  style="margin-left: 3px;" data-toggle="modal" data-target=".bd-example-modal-sm">
                <span style="padding-bottom: 2px;color: red;font-size: 10px;"><i class="fas fa-shopping-cart" style="color: red;font-size: 15px;"></i>{product.length}</span>
            </a>
            <a  href="#" class="btn px-0 "  style="margin-left: 3px;" on:click={scannerActive}>
                <img  src="img/scanner.png" alt="" width="25" height="25">
            </a>
        </div>


        <div class="modal fade bd-example-modal-sm" tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="exampleModalLabel"> <img src="img/goeat.png" width="40" height="40" >Carrito</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
              
                            <div class="row px-xl-5 pb-3" style="overflow: auto; {product.length>0?'height: 250px;':''}">
                                {#each  product as value , key}
                                    <div class="col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product">
                                        <a  href="#"class="text-decoration-none">
                                            <div class="cat-item d-flex align-items-center mb-4">
                                                <div class="overflow-hidden" style="width: 120px; height: 120px;">
                                                    <img class="img-fluid" src="{value.photo}" alt="" style="height: 119px;">
                                                </div>
                                                <div class="flex-fill pl-3">
                                                    <h6>{value.name}</h6>
                                                    <small class="text-body">100 Products</small>
                                                    <small class="text-price">S/. {value.totalmoney}.00</small>
                                                </div>
                                            </div>
                                        </a>
                                    </div>
                                {/each}
                       
                            </div>
                    </div>
                    <div class="modal-footer">
                        <tbody style="line-height:normal">
                            <tr>
                                <td>
                                    <span class="span-primary"><strong>TOTAL:</strong></span>
                                </td>
                                <td>
                                    <span class="span-primary"><strong>S/ {totalMoney}.00</strong></span>
                                </td>
                            </tr>
                        </tbody>                                            
                        <button type="button" class="btn btn-primary btn-car" data-dismiss="modal"  on:click={paymentProceed}>Proceder pago</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade bd-model" tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="exampleModalLabel">El sazon del pato</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
              
                            <div class="row px-xl-5 pb-3" style="overflow: auto; height: 290px;">
                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                 {#each  productScanner.list as value , key}
                                    <div class="col-lg-3 col-md-4 col-sm-6 pb-1 cursor-product" on:click={()=>{addProduct(value)}}>
                                        <a  href="#"class="text-decoration-none">
                                            <div class="cat-item d-flex align-items-center mb-4">
                                                <div class="overflow-hidden" style="width: 120px; height: 120px;">
                                                    <img class="img-fluid" src="{value.photo}" alt="" style="height: 119px;">
                                                </div>
                                                <div class="flex-fill pl-3">
                                                    <h6>{value.name}</h6>
                                                    <small class="text-body">100 Products</small>
                                                    <small class="text-price">S/. {value.totalmoney}.00</small>
                                                </div>
                                            </div>
                                        </a>
                                    </div>
                                {/each}
                            </div>
              
                    </div>
                    <div class="modal-footer">
                        <tbody style="line-height:normal">
                            <tr style="padding: 0;margin: 0;">
                                <td>
                                    <span class="span-primary" style="padding: 0;margin: 0;"><strong>Mesa:</strong></span>
                                </td>
                                <td>
                                    <span class="span-primary" style="padding: 0;margin: 0;"> 1</span>
                                </td>
                               
                            </tr>
            
                            <tr>
                                <td>
                                    <span class="span-primary"><strong>TOTAL:</strong></span>
                                </td>
                                <td>
                                    <span class="span-primary"><strong>S/ 0.00</strong></span>
                                </td>
                            </tr>
                        </tbody>                                            
                        <button type="button" class="btn btn-primary btn-car" on:click={()=>{location.reload();}}>Realizar pedido</button>
                    </div>
                </div>
            </div>
        </div>
        {#if gameActive}
            <div class="container">
                <input type="checkbox" id="btn-mas">
                <div class="redes">
                    <a href="#">  <img class="img-game" on:click={()=>{gameOpen=true;}} src="img/casino.jpg" width="45px" height="45px" alt=""></a>
                    <a href="#">  <img class="img-game" on:click={()=>{gameOpencasine=true;}} src="img/ruleta.jpg" width="45px" height="45px" alt=""></a>
                </div>
                <div class="btn-mas">
                    <label for="btn-mas" class="fa fa-plus"></label>
                </div>
            </div>
        {/if}
        

        {#if gameOpen==true}
            <i class="fa fa-times back-to-times" on:click={()=>{gameOpen=false;}} style="color:yellow;float: right; margin: 15px;margin-right: 18px;cursor: pointer;"></i>
            <iframe  class="back-to-iframe" width="100%" height="100%" src="https://netent-static.casinomodule.com/games/frenchroulette3_mobile_html/game/frenchroulette3_mobile_html.xhtml?staticServer=https%3A%2F%2Fnetent-static.casinomodule.com%2F&targetElement=netentgame&flashParams.bgcolor=000000&gameId=frenchroulette3_not_mobile&mobileParams.lobbyURL=https%253A%252F%252Fgames.netent.com%252Ftable-games%252Ffrench-roulette-slot%252F&server=https%3A%2F%2Fnetent-game.casinomodule.com%2F&lang=es&sessId=DEMO-0037068596-EUR&operatorId=default" frameborder="0"></iframe>
        {/if}

        {#if gameOpencasine==true}
            <i class="fa fa-times back-to-times" on:click={()=>{gameOpencasine=false;}} style="color:yellow;float: right; margin: 15px;margin-right: 18px;cursor: pointer;"></i>
            <iframe  class="back-to-iframe" width="100%" height="100%" src="https://test-2.apiusoft.com/api/pascal/opengame?gameid=63-PSG&mode=wb&m=wb&player_id=789&currency=USD&t=9f571ee526b3fbead15270b40ad58e28478b15a5b7d9ae01df37a082032a128cc3bf36f06744d216fe1a0221a2740e290cb61dd21a89381b96daefb7791dc4f6" frameborder="0"></iframe>
        {/if}

</main>

<style>

    .img-game{
        border-radius: 50%;
    }
    #btn-mas{
        display: none;
    }
    
    .redes a, .btn-mas label{
        display: block;
        text-decoration: none;
        background: #cc2b2b;
        color: #fff;
        width: 45px;
        height: 45px;
        line-height: 45px;
        text-align: center;
        border-radius: 50%;
        box-shadow: 0px 1px 10px rgba(0,0,0,0.4);
        transition: all 500ms ease;
    }

    .container{
        position: fixed;
        display: block;
        bottom: 10px;
        z-index: 11;
        animation: action 1s infinite alternate;
    }
    .redes a:hover{
        background: #fff;
        color: #cc2b2b;
    }
    .redes a{
        margin-bottom: -15px;
        opacity: 0;
        visibility: hidden;
    }
    #btn-mas:checked~ .redes a{
        margin-bottom: 10px;
        opacity: 1;
        visibility: visible;
    }
    .btn-mas label{
        cursor: pointer;
        background: #f44141;
        font-size: 23px;
    }
    #btn-mas:checked ~ .btn-mas label{
        transform: rotate(135deg);
        font-size: 25px;
    }

       #videoview {
        position: relative;
        width: 100%;
        height: 100vh;
    }

    #videoContainer {
        position: relative;
        width: 100%;
        height: 100%;
        z-index: 1
    }
    .dce-video-container{
        background: red !important;
    }
    .span-primary{
        color: #c91414;
        font-size: 12px;
    }


    .span-secundary{
        font-size: 12px;
    }

    .card{
        margin-top: 170px;
        width: 38px;
        height: 80px;
    }
    .content-page{

    }

    @media (min-width: 992px) {
        .card {
           display: none;
        }
        .buscadorMovil{
            display: none;
        }
    }

    @media (max-width: 992px) {
        .content-page{
            overflow: auto; 
            height: 86vh;
        }
       
    }

    .btn-register{
        background-color:whitesmoke;
        border-radius: 10px;
    }

    .btn-register-confirm{
        background-color:whitesmoke;
        border-radius: 10px;
        border: 1px solid greenyellow;
    }

    .btn-register-cancel{
        background-color:whitesmoke;
        border-radius: 10px;
        border: 1px solid red;
    }
    

    .btn-car{
        width: 100%;
        border-radius: 50px;
    }

    .cursor-product{
        cursor: pointer;
    }

    .btn-game i{
        color: white;
        width: 50px;
        height: 60px;
    }

    .container{
        padding: 3px;
        height: auto;   
    }

    .content-iframe{
        margin: 6px;
        width: 99%;
        padding-top: 5px;
        background: rgb(12, 11, 11);
        height: 750px;
    }

    .text-price{
        color:red;
        float: right;
        margin-right: 5px;
    }

    .panel-menu{
        margin: 1px;
    }

    .panel-secundary{
        display: flex;
        width: 100%;
        height: 95px;
        border-radius: 5px;
        padding: 1px;
        margin-bottom: 8px;
        background: white;
        border: 1px solid black;
    }
    .panel-img{
        margin: 0;
        padding: 0;
    }
    .panel-detail{
        width: 70%;

    }
    .panel-detail h2{
        margin: 5px;
        font-size: 11px;
    }

    .detail h2{
        margin: 0;
        padding: 3px;
    }

    .content-detail{
        margin-left: 15px;
    }

    body {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    #barcodeScanner {
        text-align: center;
        font-size: medium;
        height: 40vh;
        width: 40vw;
    }

</style>